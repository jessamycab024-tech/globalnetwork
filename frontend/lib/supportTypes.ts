export type SupportMessage = {
  id: string;
  sender: 'customer' | 'admin';
  text: string;
  createdAt: string;
};

export type SupportThread = {
  id: string;
  status: 'Open' | 'Pending' | 'Resolved';
  messages: SupportMessage[];
  updatedAt: string;
};
