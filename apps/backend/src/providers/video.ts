import { config } from '../config';

export interface VideoProvider {
  createMeeting(roomName: string, options?: Record<string, any>): Promise<{ url: string; provider: string }>;
}

class JitsiProvider implements VideoProvider {
  async createMeeting(roomName: string): Promise<{ url: string; provider: string }> {
    const domain = config.video.jitsiDomain || 'meet.jit.si';
    return {
      url: `https://${domain}/${roomName}`,
      provider: 'jitsi',
    };
  }
}

class ZoomProvider implements VideoProvider {
  async createMeeting(roomName: string, options?: Record<string, any>): Promise<{ url: string; provider: string }> {
    const apiKey = options?.apiKey || process.env.ZOOM_API_KEY;
    const apiSecret = options?.apiSecret || process.env.ZOOM_API_SECRET;
    if (apiKey && apiSecret) {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ iss: apiKey }, apiSecret, { expiresIn: '1h' });
      return {
        url: `https://zoom.us/j/${roomName}?pwd=${Buffer.from(token).toString('base64')}`,
        provider: 'zoom',
      };
    }
    return {
      url: `https://zoom.us/j/${roomName}`,
      provider: 'zoom',
    };
  }
}

class GoogleMeetProvider implements VideoProvider {
  async createMeeting(roomName: string): Promise<{ url: string; provider: string }> {
    return {
      url: `https://meet.google.com/new?authuser=0&hs=1&pli=1#/${roomName}`,
      provider: 'google-meet',
    };
  }
}

const providers: Record<string, VideoProvider> = {
  jitsi: new JitsiProvider(),
  zoom: new ZoomProvider(),
  'google-meet': new GoogleMeetProvider(),
};

export function getVideoProvider(name?: string): VideoProvider {
  const providerName = name || config.video.provider;
  const provider = providers[providerName];
  if (!provider) {
    return providers.jitsi;
  }
  return provider;
}

export async function createMeetingLink(roomName: string, options?: Record<string, any>) {
  const provider = getVideoProvider();
  return provider.createMeeting(roomName, options);
}
