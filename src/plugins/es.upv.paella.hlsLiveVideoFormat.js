//import Hls from 'hls.js';
import Events, { triggerEvent } from '../core/Events';

import { HlsVideo, getHlsSupport, HlsSupport, getHlsLib, defaultHlsConfig } from './es.upv.paella.hlsVideoFormat';
import VideoPlugin from '../core/VideoPlugin';
import VideoQualityItem from '../core/VideoQualityItem';

import PaellaCoreVideoFormats from './PaellaCoreVideoFormats';

const loadHls = async (player, streamData, video, config, cors) => {
    const Hls = await getHlsLib();

    if (cors.withCredentials) {
        config.xhrSetup = function(xhr,url) {
            xhr.withCredentials = cors.withCredentials;
            for (const header in cors.requestHeaders) {
                const value = cors.requestHeaders[header];
                xhr.setRequestHeader(header, value);
            }
        }
    }

    const hls = new Hls(config);
    const hlsStream =   streamData?.sources?.hlsLive?.length>0 &&
                        streamData.sources.hlsLive[0];
    const initialQualityLevel = config.initialQualityLevel !== undefined ? config.initialQualityLevel : 1;

    return [hls, new Promise((resolve,reject) => {
        let autoQualitySet = false;
        hls.on(Hls.Events.LEVEL_SWITCHED, (evt, data) => {
            this.player.log.debug(`HLS: quality level switched to ${data.level}`);
            if (!autoQualitySet) {
                hls.currentLevel = -1;
                autoQualitySet = true;
            }
            triggerEvent(player, Events.VIDEO_QUALITY_CHANGED, {});
        });

        hls.on(Hls.Events.ERROR, (event,data) => {
            if (data.fatal) {
                switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
                        reject(Error("hlsVideoFormatPlugin: unrecoverable error in HLS player. The video is not available"));
                    }
                    else {
                        player.log.warn("hlsVideoFormatPlugin: Fatal network error. Try to recover");
                        hls.startLoad();
                    }
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    player.log.warn("hlsVideoFormatPlugin: Fatal media error encountered. Try to recover");
                    hls.recoverMediaError()
                    break;
                default:
                    hls.destroy();
                    reject(Error("hlsVideoFormat: Fatal error. Can not recover"));
                }
            }
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!config.autoStartLoad) {
                hls.autoStartLoad();
            }
        });

        const rand = Math.floor(Math.random() * 100000000000);
        const url = hlsStream.src + (config.enableCache ? 
            (/\?/.test(hlsStream.src) ? `&cache=${rand}` : `?cache=${rand}`)
            : "");
        hls.loadSource(url);
        hls.attachMedia(video);

        hls._videoEventListener = () => {
            resolve();
        };
        video.addEventListener("canplay", hls._videoEventListener);
    })];
}

export class HlsLiveVideo extends HlsVideo {
    async loadStreamData(streamData) {
        const hlsSupport = await getHlsSupport();
        if (hlsSupport === HlsSupport.NATIVE) {
            // We delegate the load to HlsVideo, which in turn will delegate it to MP4Video'.
            streamData.sources.hls = streamData.sources.hlsLive;
            return super.loadStreamData(streamData);
        }
        else {
            this.player.log.debug("Loading HLS stream");

            const [hls, promise] = await loadHls(this.player, streamData, this.video, this._config, this._cors);
            this._hls = hls;
            await promise;

            this._autoQuality = new VideoQualityItem({
                label: "auto",
                shortLabel: "auto",
                index: -1,
                width: 1,
                height: 1,
                isAuto: true
            });
            // Initialize current quality
            this._currentQuality = this._autoQuality;

            // Initialize current audio track
            const tracks = await this.getAudioTracks();
            this._currentAudioTrack = tracks.find(track => track.selected);
            this.saveDisabledProperties(this.video);
        }
    }
}

export default class HlsLiveVideoFormat extends VideoPlugin {
    getPluginModuleInstance() {
        return PaellaCoreVideoFormats.Get();
    }
    
    get name() {
		return super.name || "es.upv.paella.hlsLiveVideoFormat";
	}

    get streamType() {
        return "hlsLive";
    }

    async isCompatible(streamData) {
        const hlsSupport = await getHlsSupport();
        const { hlsLive } = streamData.sources;
        return hlsLive && hlsSupport;
    }

    async getVideoInstance(playerContainer, isMainAudio) {
        return new HlsLiveVideo(this.player, playerContainer, this.config, isMainAudio);
    }
}
