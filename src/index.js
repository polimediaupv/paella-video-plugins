
import HlsVideoFormat from './plugins/es.upv.paella.hlsVideoFormat';
import HlsLiveVideoFormat from './plugins/es.upv.paella.hlsLiveVideoFormat';

export default function getVideoPluginsContext() {
    return require.context("./plugins", true, /\.js/)
}

export const videoPlugins = [
    {
        plugin: HlsVideoFormat,
        config: {
            enabled: false
        },
        plugin: HlsLiveVideoFormat,
        config: {
            enabled: false
        }
    }
];

export const allPlugins = videoPlugins;

export const HlsVideoFormatPlugin = HlsVideoFormat;
export const HlsLiveVideoFormatPluginPlugin = HlsLiveVideoFormat;
