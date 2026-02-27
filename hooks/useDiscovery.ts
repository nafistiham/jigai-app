import { useEffect } from 'react';
import Zeroconf from 'react-native-zeroconf';
import { useJigAiStore } from '../store';

interface ZeroconfService {
  name: string;
  host: string;
  port: number;
  addresses: string[];
}

export function useDiscovery(enabled: boolean) {
  const setServer = useJigAiStore((s) => s.setServer);
  const setStatus = useJigAiStore((s) => s.setStatus);

  useEffect(() => {
    if (!enabled) return;

    const zeroconf = new Zeroconf();
    setStatus('discovering');

    zeroconf.on('resolved', (service: ZeroconfService) => {
      const ip = service.addresses?.[0] ?? service.host;
      setServer({
        name: service.name.replace('._jigai._tcp.local.', '').trim(),
        ip,
        port: service.port,
      });
    });

    zeroconf.on('error', () => {
      setStatus('disconnected');
    });

    // Scan for _jigai._tcp services
    zeroconf.scan('jigai', 'tcp', 'local.');

    return () => {
      zeroconf.stop();
      zeroconf.removeDeviceListeners();
    };
  }, [enabled, setServer, setStatus]);
}
