import { useEffect, useState } from 'react';
import { BOOKING_CONFIG } from '../constants/booking';
import { getBookingConfig } from '../lib/bookingApi';

export function useServicesConfig() {
  const [servicesConfig, setServicesConfig] = useState(BOOKING_CONFIG.servicesConfig ?? {});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getBookingConfig()
      .then((data) => {
        if (data?.servicesConfig) {
          setServicesConfig(data.servicesConfig);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  return { servicesConfig, ready };
}
