export interface ApiError {
  message: string;
  status: number;
}

export interface ChurrasqueiroSummary {
  id: number;
  name: string;
  city: string;
  imgChurrasqueiro?: string | null;
  slug?: string;
}

export interface ChurrasqueiroProfileParceiro {
  id: number;
  name: string;
  category: string;
  city: string;
  couponCode: string;
}

export interface BookingResponse {
  id: number;
  userId: number;
  churrasqueiroId: number;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: string | number;
  partnerId: number | null;
  partnerName: string | null;
  partnerCouponCode: string | null;
  selectedCuts: string | null;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: number;
  bookingId: number;
  amount: string | number;
  status: "pending" | "paid" | "failed";
  provider: string | null;
  transactionId: string | null;
}

export interface PaymentResponse {
  booking: BookingResponse;
  payment: PaymentRecord;
  clientSecret?: string | null;
  status?: string;
}

export interface ChurrasqueiroProfile {
  id: number;
  name: string;
  knownAs: string;
  city: string;
  description: string | null;
  imgChurrasqueiro?: string | null;
  pricePerHour: string | number;
  rating?: string | number;
  slug: string;
  parceiros: ChurrasqueiroProfileParceiro[];
  unavailableDates: string[];
}

export interface Parceiro {
  id: number;
  name: string;
  category: string;
  description: string | null;
  featuredProducts: string | null;
  location: string;
  city: string;
  phone: string;
  openingHours: string;
  couponCode: string;
  validUntil: string;
  recommendedChurrasqueiros: ChurrasqueiroSummary[];
}

export interface BlogBlock {
  type: "text" | "image";
  text?: string;
  imageUrl?: string;
  caption?: string;
}

export interface BlogAuthor {
  id: number;
  name: string;
  city: string;
  imgChurrasqueiro?: string | null;
}

export interface BlogPost {
  id: number;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  contentBlocks: BlogBlock[];
  createdAt: string;
  updatedAt: string;
  author: BlogAuthor | null;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateChurrasqueiroPayload {
  name: string;
  city: string;
  description?: string;
  pricePerHour: number;
  imgChurrasqueiro?: string;
}

export interface CreateBookingPayload {
  churrasqueiroId: number;
  date: string;
  startTime: string;
  endTime: string;
  partnerId?: number | null;
  partnerCouponCode?: string;
  selectedCuts?: string[];
  notes?: string;
}

export interface PayBookingPayload {
  token: string;
}

export interface CreateParceiroPayload {
  name: string;
  category: string;
  description?: string;
  featuredProducts?: string;
  location: string;
  city: string;
  phone: string;
  openingHours: string;
  couponCode: string;
  validUntil: string;
  recommendedChurrasqueiroIds?: number[];
}

export interface CreateBlogPostPayload {
  title: string;
  subtitle?: string;
  contentBlocks: BlogBlock[];
}

export interface UpdateBlogPostPayload {
  title?: string;
  subtitle?: string | null;
  contentBlocks?: BlogBlock[];
}

export interface AuthResponse {
  token: string;
  user: unknown;
}
