const path = require('path');

describe('ArtifactsManager', () => {
  let proxy;

  beforeEach(() => {
    jest.mock('npmlog');
    jest.mock('fs-extra');
    jest.mock('./utils/ArtifactPathBuilder');
    jest.mock('../utils/argparse');

    proxy = {
      get ArtifactPathBuilder() {
        return require('./utils/ArtifactPathBuilder');
      },
      get ArtifactsManager() {
        return require('./ArtifactsManager');
      },
      get npmlog() {
        return require('npmlog');
      },
      get fs() {
        return require('fs-extra');
      },
      get argparse() {
        return require('../utils/argparse');
      },
    };
  });

  describe('when created', () => {
    let artifactsManager;

    beforeEach(() => {
      proxy.argparse.getArgValue.mockImplementation((key) => {
        return (key === 'artifacts-location') ? '/tmp' : '';
      });

      artifactsManager = new proxy.ArtifactsManager();
    });

    it('should provide partially working artifacts api, where .getDeviceId() throws', () => {
      expect(() => artifactsManager.artifactsApi.getDeviceId()).toThrowErrorMatchingSnapshot();
    });

    it('should provide partially working artifacts api, where .getBundleId() throws', () => {
      expect(() => artifactsManager.artifactsApi.getBundleId()).toThrowErrorMatchingSnapshot();
    });

    it('should provide partially working artifacts api, where .getPid() throws', () => {
      expect(() => artifactsManager.artifactsApi.getPid()).toThrowErrorMatchingSnapshot();
    });

    it('should provide artifacts location to path builder', async () => {
      expect(proxy.ArtifactPathBuilder).toHaveBeenCalledWith({
        artifactsRootDir: '/tmp',
      });
    });
  });

  describe('when plugin factory is registered', () => {
    let artifactsManager, factory, plugin;

    beforeEach(() => {
      factory = jest.fn().mockReturnValue(plugin = {
        onBeforeLaunchApp: jest.fn(),
      });

      artifactsManager = new proxy.ArtifactsManager();
      artifactsManager.registerArtifactPlugins({ mock: factory });
    });

    it('should not get called immediately', () => {
      expect(factory).not.toHaveBeenCalled();
    });

    describe('and the app is about to be launched for the first time', function() {
      beforeEach(async () => {
        await artifactsManager.onBeforeLaunchApp({
          deviceId: 'testDeviceId',
          bundleId: 'testBundleId',
        });
      });

      it('(factory) should get called', () => {
        expect(factory).toHaveBeenCalledWith(artifactsManager.artifactsApi);
      });

      it('should be able to get device id from artifacts API', () => {
        expect(artifactsManager.artifactsApi.getDeviceId()).toBe('testDeviceId');
      });

      it('should be able to get bundle id from artifacts API', () => {
        expect(artifactsManager.artifactsApi.getBundleId()).toBe('testBundleId');
      });

      it('still should not be able to get PID from artifacts API', () => {
        expect(() => artifactsManager.artifactsApi.getPid()).toThrowErrorMatchingSnapshot();
      });

      describe('and it launched', () => {
        beforeEach(async () => {
          await artifactsManager.onLaunchApp({
            deviceId: 'testDeviceId',
            bundleId: 'testBundleId',
            pid: 2018,
          });
        });

        it('should be able to get PID from artifacts API', () => {
          expect(artifactsManager.artifactsApi.getPid()).toBe(2018);
        });
      });
    });
  });

  describe('.artifactsApi', () => {
    let testPluginFactory;
    let testPlugin;
    let artifactsApi;
    let pathBuilder;

    beforeEach(() => {
      testPluginFactory = (api) => {
        artifactsApi = api;

        return (testPlugin = {
          name: 'testPlugin',
          disable: jest.fn(),
          onRelaunchApp: jest.fn(),
          onBeforeAll: jest.fn(),
          onBeforeEach: jest.fn(),
          onBeforeResetDevice: jest.fn(),
          onResetDevice: jest.fn(),
          onAfterEach: jest.fn(),
          onAfterAll: jest.fn(),
          onTerminate: jest.fn(),
        });
      };

      pathBuilder = {
        buildPathForTestArtifact: jest.fn(),
      };

      artifactsManager = new proxy.ArtifactsManager(pathBuilder);
    });

    describe('.preparePathForArtifact()', () => {
      let argparse, fs;

      beforeEach(() => {
        argparse = require('../utils/argparse');
        fs = require('fs-extra');
      });

      it('should prepare directory for test artifact at given path', async () => {
        const testSummary = {};
        const givenArtifactPath = path.join('artifacts', 'something', 'startup.log');
        pathBuilder.buildPathForTestArtifact.mockReturnValue(givenArtifactPath);

        const returnedArtifactPath = await artifactsManager.artifactsApi.preparePathForArtifact('test', testSummary);

        expect(pathBuilder.buildPathForTestArtifact).toHaveBeenCalledWith('test', testSummary);
        expect(returnedArtifactPath).toBe(givenArtifactPath);
        expect(fs.ensureDir).toHaveBeenCalledWith(path.join('artifacts', 'something'));
      });
    });
  });
});
