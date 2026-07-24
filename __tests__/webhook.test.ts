import { describe, it, expect, vi } from 'vitest';
import { POST } from '../src/app/api/webhooks/fedapay/route';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      })),
      insert: vi.fn().mockResolvedValue({ error: null })
    }))
  }))
}));

describe('FedaPay Webhook API', () => {
  it('should process transaction.approved and create an escrow collaboration', async () => {
    const mockRequest = new Request('http://localhost/api/webhooks/fedapay', {
      method: 'POST',
      body: JSON.stringify({
        name: 'transaction.approved',
        entity: {
          amount: 50000,
          custom_metadata: {
            applicationId: 'app_123',
            brandId: 'brand_123',
            influencerId: 'inf_123'
          }
        }
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Escrow secured');
    expect(createClient).toHaveBeenCalled();
  });

  it('should ignore transaction.canceled', async () => {
    const mockRequest = new Request('http://localhost/api/webhooks/fedapay', {
      method: 'POST',
      body: JSON.stringify({ name: 'transaction.canceled' })
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Transaction canceled ignored');
  });
});
