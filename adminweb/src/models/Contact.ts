export interface Contact {
  _id?: string;
  email: string;
  phone: string;
  address: string;
  privacyEmail?: string;
  legalEmail?: string;
  supportEmail?: string;
  businessName: string;
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactFormData {
  email: string;
  phone: string;
  address: string;
  businessName: string;
  privacyEmail: string;
  legalEmail: string;
  supportEmail: string;
}

export const defaultContact: Contact = {
  email: 'contact@inventorysystem.com',
  phone: '+1 (555) 123-4567',
  address: '123 Business Street, Suite 100, Business City, BC 12345',
  privacyEmail: 'privacy@inventorysystem.com',
  legalEmail: 'legal@inventorysystem.com',
  supportEmail: 'support@inventorysystem.com',
  businessName: 'Inventory Management System'
};
