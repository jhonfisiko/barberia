export const BUSINESS = {
  name: "Woeaco Barber Estudio",
  // Cambia por el número real, con código de país y sin "+" ni espacios
  whatsapp: "573000000000",
  address: "Dirección del local",
  hours: "Lun a Sáb · 9:00 a.m. – 7:00 p.m.",
};

export type Service = {
  id: string;
  name: string;
  description: string;
  minutes: number;
  price: number;
  popular?: boolean;
};

export type Barber = {
  id: string;
  name: string;
  role: string;
  bio: string;
  specialties: string[];
  works: { id: string; title: string }[];
};

export const SERVICES: Service[] = [
  {
    id: "corte-clasico",
    name: "Corte clásico",
    description: "Corte a tijera o máquina, acabado limpio.",
    minutes: 30,
    price: 25000,
  },
  {
    id: "fade",
    name: "Fade / Degradado",
    description: "Degradado a la medida, bajo, medio o alto.",
    minutes: 40,
    price: 30000,
    popular: true,
  },
  {
    id: "barba",
    name: "Barba",
    description: "Perfilado y arreglo con toalla caliente.",
    minutes: 25,
    price: 20000,
  },
  {
    id: "corte-barba",
    name: "Corte + Barba",
    description: "La experiencia completa en una sola cita.",
    minutes: 60,
    price: 45000,
    popular: true,
  },
  {
    id: "cejas",
    name: "Perfilado de cejas",
    description: "Detalle rápido para rematar el look.",
    minutes: 15,
    price: 10000,
  },
  {
    id: "facial",
    name: "Limpieza facial",
    description: "Limpieza e hidratación con mascarilla.",
    minutes: 40,
    price: 35000,
    popular: true,
  },
];

export const BARBERS: Barber[] = [
  {
    id: "barbero-1",
    name: "Barbero 1",
    role: "Barbero principal",
    bio: "Especialista en degradados limpios y cortes modernos.",
    specialties: ["Fade", "Corte moderno"],
    works: [
      { id: "b1-1", title: "Low fade" },
      { id: "b1-2", title: "Mid fade texturizado" },
      { id: "b1-3", title: "Corte + barba" },
      { id: "b1-4", title: "Taper clásico" },
    ],
  },
  {
    id: "barbero-2",
    name: "Barbero 2",
    role: "Barbero",
    bio: "Barbas, perfilados y cortes clásicos con detalle.",
    specialties: ["Barba", "Clásico"],
    works: [
      { id: "b2-1", title: "Barba perfilada" },
      { id: "b2-2", title: "Corte clásico" },
      { id: "b2-3", title: "Diseño con navaja" },
      { id: "b2-4", title: "Corte + cejas" },
    ],
  },
];

export const TIMES = [
  "09:00", "10:00", "11:00", "12:00", "14:00",
  "15:00", "16:00", "17:00", "18:00",
];

export const formatPrice = (n: number) =>
  "$" + n.toLocaleString("es-CO");