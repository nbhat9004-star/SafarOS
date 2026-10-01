'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestInventoryPage() {
  const [inventoryTypes, setInventoryTypes] = useState([]);
  const [useInventoryTypes, setUseInventoryTypes] = useState(false);

  const addInventoryType = () => {
    setInventoryTypes([...inventoryTypes, {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 3000,
      quantity: 1,
      status: 'active',
      displayOrder: inventoryTypes.length
    }]);
  };

  const removeInventoryType = (id) => {
    setInventoryTypes(inventoryTypes.filter(t => t.id !== id));
  };

  const updateInventoryType = (id, field, value) => {
    setInventoryTypes(inventoryTypes.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const moveTypeUp = (index) => {
    if (index === 0) return;
    const newTypes = [...inventoryTypes];
    [newTypes[index - 1], newTypes[index]] = [newTypes[index], newTypes[index - 1]];
    newTypes.forEach((t, i) => t.displayOrder = i);
    setInventoryTypes(newTypes);
  };

  const moveTypeDown = (index) => {
    if (index === inventoryTypes.length - 1) return;
    const newTypes = [...inventoryTypes];
    [newTypes[index], newTypes[index + 1]] = [newTypes[index + 1], newTypes[index]];
    newTypes.forEach((t, i) => t.displayOrder = i);
    setInventoryTypes(newTypes);
  };

  return (
    <div className="min-h-screen bg-secondary/20 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">🏨 Multi-Type Inventory Test Page</h1>
              <p className="text-muted-foreground">
                This page demonstrates the multi-type inventory functionality for hotels, homestays, and vehicle rentals.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              variant={useInventoryTypes ? "default" : "outline"}
              onClick={() => {
                setUseInventoryTypes(!useInventoryTypes);
                if (!useInventoryTypes && inventoryTypes.length === 0) {
                  addInventoryType();
                }
              }}
              className="rounded-full"
            >
              {useInventoryTypes ? '✅ Enabled' : 'Enable Multi-Type'}
            </Button>
          </div>

          {!useInventoryTypes && (
            <div className="p-6 rounded-xl border bg-secondary/20">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Multi-Type Inventory is Disabled</p>
                <p className="text-sm text-muted-foreground">
                  Click "Enable Multi-Type" to create multiple room types or vehicle types with different pricing.
                </p>
              </div>
            </div>
          )}

          {useInventoryTypes && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm font-semibold text-emerald-900">✅ Multi-Type Inventory Enabled</p>
                <p className="text-xs text-emerald-700 mt-1">You can now create multiple inventory types with different pricing and quantities.</p>
              </div>

              {inventoryTypes.map((type, idx) => (
                <div key={type.id} className="p-6 rounded-xl border bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-emerald-600">Type {idx + 1}</div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveTypeUp(idx)}
                          disabled={idx === 0}
                          className="px-3 py-1 hover:bg-secondary rounded-lg disabled:opacity-30 font-bold"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTypeDown(idx)}
                          disabled={idx === inventoryTypes.length - 1}
                          className="px-3 py-1 hover:bg-secondary rounded-lg disabled:opacity-30 font-bold"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInventoryType(type.id)}
                      className="text-sm text-rose-500 hover:underline font-semibold"
                    >
                      🗑 Remove
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Standard Room, Swift Car, Royal Enfield"
                        value={type.name}
                        onChange={(e) => updateInventoryType(type.id, 'name', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        placeholder="3000"
                        value={type.price}
                        onChange={(e) => updateInventoryType(type.id, 'price', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Quantity Available *</label>
                      <input
                        type="number"
                        placeholder="10"
                        min="1"
                        value={type.quantity}
                        onChange={(e) => updateInventoryType(type.id, 'quantity', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Status</label>
                      <select
                        value={type.status}
                        onChange={(e) => updateInventoryType(type.id, 'status', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border"
                      >
                        <option value="active">✅ Active</option>
                        <option value="inactive">⏸ Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-medium block mb-1">Description (optional)</label>
                    <textarea
                      placeholder="Describe this type (e.g., Spacious room with lake view)"
                      value={type.description}
                      onChange={(e) => updateInventoryType(type.id, 'description', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                onClick={addInventoryType}
                variant="outline"
                size="lg"
                className="w-full rounded-xl"
              >
                ➕ Add Another Type
              </Button>

              {inventoryTypes.length > 0 && (
                <div className="mt-8 p-6 rounded-xl bg-blue-50 border border-blue-200">
                  <h3 className="font-bold text-lg mb-4">📊 Preview - Inventory Types</h3>
                  <div className="space-y-2">
                    {inventoryTypes.map((type, idx) => (
                      <div key={type.id} className="flex items-center justify-between p-3 rounded-lg bg-white">
                        <div>
                          <span className="font-semibold">{type.name || `Type ${idx + 1}`}</span>
                          {type.description && <span className="text-xs text-muted-foreground ml-2">- {type.description}</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-emerald-600 font-bold">₹{Number(type.price).toLocaleString('en-IN')}</span>
                          <span className="text-sm text-muted-foreground">× {type.quantity} units</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${type.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {type.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-6 rounded-xl bg-amber-50 border border-amber-200">
            <h3 className="font-bold mb-2">📍 Where to Find This in Production:</h3>
            <ul className="text-sm space-y-1 text-amber-900">
              <li><strong>1. Add Listing Page:</strong> <code className="bg-white px-2 py-0.5 rounded">http://localhost:3000/add-listing</code></li>
              <li><strong>2. Navigate to Step 5:</strong> Click "Next" 5 times to reach "Inventory" step</li>
              <li><strong>3. Enable Multi-Type:</strong> Click the toggle button</li>
              <li><strong>4. Add Types:</strong> Create room types or vehicle types</li>
              <li><strong>5. Reorder:</strong> Use ↑ ↓ arrows to change display order</li>
            </ul>
          </div>

          <div className="mt-4 p-6 rounded-xl bg-green-50 border border-green-200">
            <h3 className="font-bold mb-2">✅ Example Use Cases:</h3>
            <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <p className="font-semibold text-green-900">🏨 Hotel:</p>
                <ul className="ml-4 text-green-800 space-y-1">
                  <li>• Standard Room - ₹3,000 × 10 units</li>
                  <li>• Deluxe Room - ₹5,000 × 5 units</li>
                  <li>• Suite - ₹8,000 × 2 units</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-green-900">🚗 Car Rental:</p>
                <ul className="ml-4 text-green-800 space-y-1">
                  <li>• Swift Dzire - ₹2,500/day × 3 units</li>
                  <li>• Innova - ₹4,000/day × 2 units</li>
                  <li>• Tempo Traveller - ₹6,000/day × 1 unit</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
