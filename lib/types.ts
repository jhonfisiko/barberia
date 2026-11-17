export type Barber = {
  id: string;
  name: string;
  role_title: string | null;
  bio: string | null;
  specialties: string[] | null;
  photo_url: string | null;
};

export type Service = {
  id: string;
  name: string;
  description: string | null;
  minutes: number;
  price: number;
  popular: boolean | null;
};

export type Work = {
  id: string;
  barber_id: string;
  title: string | null;
  image_url: string;
};

export type Settings = {
  name: string | null;
  whatsapp: string | null;
  address: string | null;
  hours_text: string | null;
  open_time: string;
  close_time: string;
  slot_minutes: number;
  closed_days: number[];
};
export type BarberService = {
  barber_id: string;
  service_id: string;
  minutes: number | null;
  price: number | null;
};