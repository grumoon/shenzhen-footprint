export interface Footprint {
  id: number;
  name: string;
  type: 'marker' | 'polyline' | 'polygon';
  category: string;
  geometry: GeoJSON;
  description?: string;
  photos?: string[];
  status: 'visited' | 'want' | 'collected';
  visit_date?: string;
  rating?: number;
  tags?: string[];
  color: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GeoJSON {
  type: 'Point' | 'LineString' | 'Polygon';
  coordinates: number[] | number[][] | number[][][];
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color: string;
  sort_order: number;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}
