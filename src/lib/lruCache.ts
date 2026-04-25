type Node<K, V> = {
  key: K;
  value: V;
  prev: Node<K, V> | null;
  next: Node<K, V> | null;
};

/**
 * Caché LRU (Least Recently Used) con lista doblemente enlazada + Map.
 * Complejidad get/set: O(1) amortizado.
 */
export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly map = new Map<K, Node<K, V>>();
  private head: Node<K, V>;
  private tail: Node<K, V>;

  constructor(capacity: number) {
    if (capacity < 1) {
      throw new RangeError("capacity debe ser >= 1");
    }
    this.capacity = capacity;
    // centinelas ficticios simplifican inserción/eliminación
    this.head = { key: null as unknown as K, value: null as unknown as V, prev: null, next: null };
    this.tail = { key: null as unknown as K, value: null as unknown as V, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);
    return node.value;
  }

  set(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }
    if (this.map.size >= this.capacity) {
      const lru = this.tail.prev!;
      this.detach(lru);
      this.map.delete(lru.key);
    }
    const node: Node<K, V> = { key, value, prev: null, next: null };
    this.map.set(key, node);
    this.attachAfter(this.head, node);
  }

  private detach(node: Node<K, V>) {
    const p = node.prev!;
    const n = node.next!;
    p.next = n;
    n.prev = p;
    node.prev = node.next = null;
  }

  private attachAfter(after: Node<K, V>, node: Node<K, V>) {
    const next = after.next!;
    after.next = node;
    node.prev = after;
    node.next = next;
    next.prev = node;
  }

  private moveToFront(node: Node<K, V>) {
    this.detach(node);
    this.attachAfter(this.head, node);
  }
}
