import { SERVICE_DURATIONS, formatDuration } from '../constants/booking';
import { servicesData } from '../constants/services';

export function getAllBookableServices() {
  const services = Object.entries(servicesData).flatMap(([categoryKey, category]) =>
    category.items.map((item) => {
      const durationMinutes = SERVICE_DURATIONS[item.name] ?? 60;
      return {
        id: item.name,
        name: item.name,
        category: category.title,
        categoryKey,
        durationMinutes,
        durationLabel: formatDuration(durationMinutes),
        price: item.price,
      };
    }),
  );

  return [
    {
      id: 'Valoración médica',
      name: 'Valoración médica',
      category: 'Consulta',
      categoryKey: 'consulta',
      durationMinutes: SERVICE_DURATIONS['Valoración médica'],
      durationLabel: formatDuration(SERVICE_DURATIONS['Valoración médica']),
      price: 'Sin costo inicial · según tratamiento',
    },
    ...services,
  ];
}
