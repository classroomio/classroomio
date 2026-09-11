import { describe, expect, it } from 'vitest';
import {
  calculateNextContentOrder,
  calculateNextSectionOrder,
  UNGROUPED_SECTION_KEY
} from '../src/functions/course-content';

describe('calculateNextSectionOrder', () => {
  it('returns 1 when there are no sections and no reservations', () => {
    expect(calculateNextSectionOrder([])).toBe(1);
  });

  it('calculates next order based on server sections', () => {
    const sections = [{ order: 1 }, { order: 2 }, { order: 3 }];
    expect(calculateNextSectionOrder(sections)).toBe(4);
  });

  it('handles sections with missing orders by falling back to 1-based index', () => {
    const sections = [{ order: null }, { order: undefined }];
    // index fallback produces orders 1, 2 -> max is 2 -> next is 3
    expect(calculateNextSectionOrder(sections)).toBe(3);
  });

  it('allocates distinct, monotonically increasing orders while refresh is pending', () => {
    // Initial server state: 2 sections
    const serverSections = [{ order: 1 }, { order: 2 }];
    const reservedOrders: number[] = [];

    // First creation
    const order1 = calculateNextSectionOrder(serverSections, reservedOrders);
    expect(order1).toBe(3);
    reservedOrders.push(order1);

    // Repeat creation while server still only has 2 sections
    const order2 = calculateNextSectionOrder(serverSections, reservedOrders);
    expect(order2).toBe(4);
    reservedOrders.push(order2);

    // Another repeat creation
    const order3 = calculateNextSectionOrder(serverSections, reservedOrders);
    expect(order3).toBe(5);
    reservedOrders.push(order3);

    expect(new Set([order1, order2, order3]).size).toBe(3);
  });

  it('seamlessly reconciles when server refresh completes', () => {
    // Before refresh: server has 1, 2; reserved has 3, 4
    const reserved = [3, 4];
    expect(calculateNextSectionOrder([{ order: 1 }, { order: 2 }], reserved)).toBe(5);

    // After refresh: server now has 1, 2, 3, 4
    const refreshedServer = [{ order: 1 }, { order: 2 }, { order: 3 }, { order: 4 }];
    expect(calculateNextSectionOrder(refreshedServer, reserved)).toBe(5);
  });
});

describe('calculateNextContentOrder', () => {
  it('returns 1 when content is empty or null', () => {
    expect(calculateNextContentOrder(null)).toBe(1);
    expect(calculateNextContentOrder(undefined)).toBe(1);
    expect(calculateNextContentOrder({ grouped: false, sections: [], items: [] })).toBe(1);
  });

  it('calculates order for flat (ungrouped) content', () => {
    const content = {
      grouped: false,
      sections: [],
      items: [{ order: 1 }, { order: 2 }]
    };
    expect(calculateNextContentOrder(content)).toBe(3);
  });

  it('reserves orders for consecutive ungrouped content creates while refresh is pending', () => {
    const content = {
      grouped: false,
      sections: [],
      items: [{ order: 1 }]
    };
    const reserved: number[] = [];

    const order1 = calculateNextContentOrder(content, undefined, reserved);
    expect(order1).toBe(2);
    reserved.push(order1);

    const order2 = calculateNextContentOrder(content, undefined, reserved);
    expect(order2).toBe(3);
    reserved.push(order2);

    expect(order1).not.toBe(order2);
  });

  it('calculates order for grouped content in an existing section', () => {
    const content = {
      grouped: true,
      sections: [
        {
          id: 'sec-1',
          items: [{ order: 1 }, { order: 2 }]
        },
        {
          id: 'sec-2',
          items: [{ order: 1 }]
        }
      ],
      items: []
    };

    expect(calculateNextContentOrder(content, 'sec-1')).toBe(3);
    expect(calculateNextContentOrder(content, 'sec-2')).toBe(2);
  });

  it('calculates order for unsectioned content within grouped content when targetSectionId is omitted', () => {
    const content = {
      grouped: true,
      sections: [
        {
          id: UNGROUPED_SECTION_KEY,
          items: [{ order: 1 }, { order: 2 }]
        },
        {
          id: 'sec-1',
          items: [{ order: 1 }]
        }
      ],
      items: []
    };

    expect(calculateNextContentOrder(content)).toBe(3);
  });

  it('reserves orders for consecutive creates in a brand-new section not yet in server outline', () => {
    // Newly created section has not landed in server outline yet
    const content = {
      grouped: true,
      sections: [
        {
          id: 'sec-1',
          items: [{ order: 1 }]
        }
      ],
      items: []
    };
    const targetSectionId = 'brand-new-section-id';
    const reserved: number[] = [];

    // First content in new section
    const order1 = calculateNextContentOrder(content, targetSectionId, reserved);
    expect(order1).toBe(1);
    reserved.push(order1);

    // Second content in new section (Create another)
    const order2 = calculateNextContentOrder(content, targetSectionId, reserved);
    expect(order2).toBe(2);
    reserved.push(order2);

    // Third content in new section (Create another)
    const order3 = calculateNextContentOrder(content, targetSectionId, reserved);
    expect(order3).toBe(3);
    reserved.push(order3);

    expect(new Set([order1, order2, order3]).size).toBe(3);
  });
});
