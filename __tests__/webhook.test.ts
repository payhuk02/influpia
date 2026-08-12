import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/webhooks/fedapay/route';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  const selectMock = vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }));

  const updateMock = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null })
  }));

  const insertMock = vi.fn().mockResolvedValue({ error: null });

  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: selectMock,
        update: updateMock,
        insert: insertMock
      }))
    }))
  };
});

describe('FedaPay Webhook API', () => {
  const secret = 'test_secret';

  beforeEach(() => {
    process.env.FEDAPAY_WEBHOOK_SECRET = secret;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key';
    vi.clearAllMocks();
  });

  function createSignedRequest(bodyObj: any) {
    const rawBody = JSON.stringify(bodyObj);
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    
    return new Request('http://localhost/api/webhooks/fedapay', {
      method: 'POST',
      headers: {
        'x-fedapay-signature': signature
      },
      body: rawBody
    });
  }

  it('should process transaction.approved and create an escrow collaboration', async () => {
    const mockRequest = createSignedRequest({
      name: 'transaction.approved',
      entity: {
        id: 999,
        amount: 50000,
        custom_metadata: {
          applicationId: 'app_123',
          brandId: 'brand_123',
          influencerId: 'inf_123'
        }
      }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Campaign Escrow secured via FedaPay');
    expect(createClient).toHaveBeenCalled();
  });

  it('should ignore transaction.canceled', async () => {
    const mockRequest = createSignedRequest({ 
      name: 'transaction.canceled',
      entity: { id: 888 }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Event ignored');
  });

  it('should return 401 if signature is missing or invalid', async () => {
    const rawBody = JSON.stringify({ name: 'transaction.approved' });
    const mockRequest = new Request('http://localhost/api/webhooks/fedapay', {
      method: 'POST',
      headers: {
        'x-fedapay-signature': 'invalid_signature'
      },
      body: rawBody
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Signature invalide');
  });
});
