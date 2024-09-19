
import HlsLiveVideoFormat from './plugins/es.upv.paella.hlsLiveVideoFormat';
import HlsVideoFormat, {
    HlsVideo,
    getHlsSupport,
    defaultHlsConfig,
    HlsSupport
} from './plugins/es.upv.paella.hlsVideoFormat';

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
export const HlsLiveVideoFormatPlugin = HlsLiveVideoFormat;

export const hlsTools = {
    HlsVideo,
    getHlsSupport,
    defaultHlsConfig,
    HlsSupport
}

