export interface ApiError {
  message: string;
  status: number;
}

export interface ChatParticipant {
  id: number;
  name: string;
  role: "user" | "admin" | "churrasqueiro";
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
}

export interface ChatConversation {
  id: number;
  participant: ChatParticipant;
  lastMessage: {
    id: number;
    body: string;
    senderId: number;
    createdAt: string;
  } | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChurrasqueiroSummary {
  id: number;
  name: string;
  city: string;
  imgChurrasqueiro?: string | null;
  slug?: string;
}

export interface PaginatedChurrasqueirosResponse {
  items: ChurrasqueiroSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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
  serviceAmount: string | number;
  platformFeeAmount: string | number;
  travelFee: string | number;
  estimatedPrice: string | number;
  approvedPrice: string | number | null;
  totalPrice: string | number;
  partnerId: number | null;
  partnerName: string | null;
  partnerCouponCode: string | null;
  selectedCuts: string | null;
  notes: string | null;
  status:
    | "PENDENTE_ORCAMENTO"
    | "EM_ANALISE_CHURRASQUEIRO"
    | "AJUSTADO_PELO_CHURRASQUEIRO"
    | "APROVADO_PARA_PAGAMENTO"
    | "RECUSADO"
    | "PAGO"
    | "CANCELADO";
  createdAt: string;
  updatedAt: string;
}

export interface ChurrasqueiroBookingResponse extends BookingResponse {
  customer: {
    id: number;
    name: string;
    email: string;
  } | null;
  payment: PaymentRecord | null;
}

export interface MyBookingResponse extends BookingResponse {
  churrasqueiro: {
    id: number;
    name: string;
    city: string;
    imgChurrasqueiro?: string | null;
  } | null;
  payment: PaymentRecord | null;
}

export interface PaymentRecord {
  id: number;
  bookingId: number;
  amount: string | number;
  status: "pending" | "paid" | "failed";
  provider: string | null;
  transactionId: string | null;
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
  guestCount?: number;
  selectedCuts?: string[];
  notes?: string;
}

export interface ReviewBookingPayload {
  action: "approve" | "adjust" | "reject";
  approvedPrice?: number | null;
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
  user: {
    id: number;
    name: string;
    email: string;
    role: "user" | "admin" | "churrasqueiro";
  };
}

export interface CurrentUserProfile {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin" | "churrasqueiro";
  createdAt?: string;
  updatedAt?: string;
}
