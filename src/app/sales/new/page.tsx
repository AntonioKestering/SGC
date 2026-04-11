// src/app/sales/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShoppingCart, Trash2, Save } from 'lucide-react';

interface ProductData {
  id: string;
  name: string;
  barcode: string | null;
  price_sale: number | null;
}

interface SaleItem {
  id: string; // temporary ID for UI
  product_id: string;
  batch_id?: string | null; // NOVO: rastreamento de lote
  product?: ProductData;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
}

interface PatientData {
  id: string;
  name: string;
  cpf?: string | null;
  birth_date?: string | null;
  phone?: string | null;
}

const PAYMENT_METHODS = [
  { value: 0, label: 'Dinheiro' },
  { value: 1, label: 'PIX' },
  { value: 2, label: 'Crediário' },
  { value: 3, label: 'Débito' },
  { value: 4, label: 'Crédito' },
];

export default function NewSalePage() {
  const router = useRouter();

  // Estado da venda
  const [patientId, setPatientId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<SaleItem[]>([]);

  // Busca de produtos
  const [barcodeSearch, setBarcodeSearch] = useState<string>('');
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);

  // Busca de lotes (PVPS)
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<ProductData | null>(null);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [showBatchSelector, setShowBatchSelector] = useState(false);

  // Busca de pacientes
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [filteredPatients, setFilteredPatients] = useState<PatientData[]>([]);

  // Pacientes
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  // Estado da submissão
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Buscar produtos e pacientes ao carregar página
  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, patientsRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/patients'),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setAllProducts(data.products || []);
        } else {
          console.error('Erro ao buscar produtos');
        }

        if (patientsRes.ok) {
          const data = await patientsRes.json();
          console.log('[NewSale] Pacientes recebidos da API:', data.patients);
          setPatients(data.patients || []);
        } else {
          console.error('Erro ao buscar pacientes', await patientsRes.text());
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setPatientsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filtrar produtos conforme o usuário digita o código de barras
  useEffect(() => {
    if (!barcodeSearch.trim()) {
      setFilteredProducts([]);
      setShowProductDropdown(false);
      return;
    }

    const query = barcodeSearch.toLowerCase();
    const filtered = allProducts.filter(
      (p) =>
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        p.name.toLowerCase().includes(query)
    );

    setFilteredProducts(filtered);
    setShowProductDropdown(filtered.length > 0);
  }, [barcodeSearch, allProducts]);

  // Filtrar pacientes conforme o usuário digita
  useEffect(() => {
    if (!patientSearch.trim()) {
      setFilteredPatients([]);
      return;
    }

    if (!patients || patients.length === 0) {
      setFilteredPatients([]);
      return;
    }

    const query = patientSearch.toLowerCase();
    const filtered = patients.filter((p) => {
      if (!p) return false;
      // Busca por nome
      if (p.name && p.name.toLowerCase().includes(query)) return true;
      // Busca por CPF (removendo caracteres especiais para comparação)
      if (p.cpf) {
        const cleanCpf = p.cpf.replace(/\D/g, '');
        const cleanQuery = query.replace(/\D/g, '');
        // Só buscar por CPF se houver números na query
        if (cleanQuery && cleanCpf.includes(cleanQuery)) return true;
      }
      return false;
    });

    console.log(`[Filtro Pacientes] Query: "${query}", Total pacientes: ${patients.length}, Filtrados: ${filtered.length}`, filtered);
    setFilteredPatients(filtered);
  }, [patientSearch, patients]);

  // Adicionar produto à venda
  function addProductToSale(product: ProductData) {
    // Se há lotes disponíveis, mostrar seletor
    setSelectedProductForBatch(product);
    setShowBatchSelector(true);
    setBarcodeSearch('');
    setShowProductDropdown(false);

    // Buscar lotes para este produto (PVPS - ordenado por expiry_date ASC)
    fetchBatchesForProduct(product.id);
  }

  // Buscar lotes do produto
  async function fetchBatchesForProduct(productId: string) {
    try {
      const res = await fetch(`/api/product-batches?product_id=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableBatches(data.batches || []);
      }
    } catch (err) {
      console.error('Erro ao buscar lotes:', err);
    }
  }

  // Confirmar adição de produto com ou sem lote
  function confirmProductAddition(batchId?: string) {
    if (!selectedProductForBatch) return;

    const product = selectedProductForBatch;
    const existingItem = items.find(
      (i) => i.product_id === product.id && i.batch_id === (batchId || null)
    );

    if (existingItem) {
      // Aumentar quantidade
      updateItem(existingItem.id, { quantity: existingItem.quantity + 1 });
    } else {
      // Novo item
      const newItem: SaleItem = {
        id: Math.random().toString(36),
        product_id: product.id,
        batch_id: batchId || null,
        product,
        quantity: 1,
        unit_price: product.price_sale || 0,
        discount_percent: 0,
        discount_amount: 0,
        tax_percent: 0,
      };
      setItems([...items, newItem]);
    }

    // Limpar seletor
    setShowBatchSelector(false);
    setSelectedProductForBatch(null);
    setAvailableBatches([]);
  }

  // Atualizar item com cálculo automático de desconto
  function updateItem(id: string, updates: Partial<SaleItem>) {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, ...updates };

        // Se usuario mudou desconto percentual, calcula desconto em reais
        if (updates.discount_percent !== undefined) {
          const lineSubtotal = updated.quantity * updated.unit_price;
          updated.discount_amount = (lineSubtotal * updated.discount_percent) / 100;
        }

        // Se usuario mudou desconto em reais, calcula desconto percentual
        if (updates.discount_amount !== undefined && updates.discount_percent === undefined) {
          const lineSubtotal = updated.quantity * updated.unit_price;
          if (lineSubtotal > 0) {
            updated.discount_percent = (updated.discount_amount / lineSubtotal) * 100;
          }
        }

        return updated;
      })
    );
  }

  // Remover item
  function removeItem(id: string) {
    setItems(items.filter((item) => item.id !== id));
  }

  // Calcular totais
  function calculateTotals() {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    items.forEach((item) => {
      const lineTotal = item.quantity * item.unit_price;
      subtotal += lineTotal;
      discountTotal += item.discount_amount || 0;
      taxTotal += (lineTotal - (item.discount_amount || 0)) * (item.tax_percent || 0) / 100;
    });

    return {
      subtotal,
      discountTotal,
      taxTotal,
      total: subtotal - discountTotal + taxTotal,
    };
  }

  const totals = calculateTotals();

  // Submeter venda
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (items.length === 0) {
      setError('Adicione pelo menos 1 item à venda');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId || null,
          items: items.map((item) => ({
            product_id: item.product_id,
            batch_id: item.batch_id || null, // NOVO: incluir batch_id
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount,
            tax_percent: item.tax_percent,
            cost_price: null,
            sku: item.product?.barcode || null,
          })),
          payment_method: paymentMethod,
          discount_amount: totals.discountTotal,
          tax_amount: totals.taxTotal,
          notes,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        // Erro detalhado do servidor
        const errorMessage = json.error || 'Erro ao criar venda';
        setError(`Erro ao finalizar venda: ${errorMessage}`);
        setIsSaving(false);
        return;
      }

      // Sucesso
      setSuccessMessage('Venda registrada com sucesso! Redirecionando...');
      setTimeout(() => {
        router.push('/sales');
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao criar venda:', err);
      setError(`Erro ao finalizar venda: ${err.message || 'Erro desconhecido'}`);
      setIsSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-6xl">
          <header className="mb-8">
            <h2 className="text-3xl font-semibold text-zinc-50 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 mr-3 text-pink-500" />
              Nova Venda
            </h2>
          </header>

          <div className="bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm">✓ {successMessage}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">✕ {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Seção: Cliente (full width para dropdown funcionar) */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Cliente (Opcional)
                </label>
                {patientsLoading ? (
                  <div className="px-4 py-2 bg-zinc-800 text-zinc-500 text-sm rounded-lg">
                    Carregando pacientes...
                  </div>
                ) : patients.length === 0 ? (
                  <div className="px-4 py-2 bg-zinc-800 text-zinc-500 text-sm rounded-lg">
                    Nenhum paciente cadastrado
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Buscar por nome ou CPF..."
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                      disabled={isSaving}
                      autoComplete="off"
                    />

                    {/* Se houver paciente selecionado, mostrar seleção */}
                    {patientId && patients.length > 0 && (
                      <div className="mt-2 text-sm text-zinc-300">
                        ✓ {patients.find((p) => p.id === patientId)?.name || 'Paciente selecionado'}
                      </div>
                    )}

                    {/* Dropdown de Pacientes */}
                    {patientSearch.trim() && filteredPatients && filteredPatients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                        {filteredPatients.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => {
                              setPatientId(patient.id);
                              setPatientSearch('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-700 transition border-b border-zinc-700 last:border-b-0 space-y-1"
                          >
                            <div className="text-zinc-100 font-medium">{patient.name}</div>
                            <div className="text-xs text-zinc-400 space-y-0.5">
                              {patient.cpf && <div>CPF: {patient.cpf}</div>}
                              {patient.birth_date && (
                                <div>
                                  Nascimento: {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                              {patient.phone && <div>Telefone: {patient.phone}</div>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mensagem se nenhum resultado encontrado */}
                    {patientSearch.trim() && filteredPatients && filteredPatients.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 p-3">
                        <div className="text-sm text-zinc-400">Nenhum paciente encontrado para "{patientSearch}"</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Seção: Dados da Venda (Método de Pagamento) */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Método de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                  disabled={isSaving}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal: Seletor de Lotes (PVPS) */}
              {showBatchSelector && selectedProductForBatch && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                      Selecione um Lote - {selectedProductForBatch.name}
                    </h3>

                    {availableBatches.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-zinc-400 mb-4">
                          Nenhum lote disponível para este produto
                        </p>
                        <button
                          type="button"
                          onClick={() => confirmProductAddition()}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition"
                        >
                          Continuar Sem Lote
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                          {availableBatches.map((batch) => {
                            const expiryDate = new Date(batch.expiry_date);
                            const daysToExpiry = Math.ceil(
                              (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                            );

                            return (
                              <button
                                key={batch.id}
                                type="button"
                                onClick={() => confirmProductAddition(batch.id)}
                                className={`w-full p-3 rounded-lg border text-left transition ${
                                  daysToExpiry <= 30
                                    ? 'bg-yellow-500/10 border-yellow-600 hover:bg-yellow-500/20'
                                    : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="font-medium text-zinc-100">
                                    {batch.batch_number || `Lote #${batch.id.slice(0, 8)}`}
                                  </div>
                                  <div className="text-sm font-semibold text-pink-400">
                                    {batch.current_quantity} unidades
                                  </div>
                                </div>
                                <div className="text-xs text-zinc-400">
                                  Validade: {expiryDate.toLocaleDateString('pt-BR')}
                                  {daysToExpiry <= 30 && (
                                    <span className="text-yellow-400 ml-2">({daysToExpiry} dias)</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowBatchSelector(false);
                              setSelectedProductForBatch(null);
                            }}
                            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmProductAddition()}
                            className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition"
                          >
                            Sem Lote
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Seção: Buscar e Adicionar Produtos */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Buscar Produto (por código ou nome)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={barcodeSearch}
                    onChange={(e) => setBarcodeSearch(e.target.value)}
                    placeholder="Digite o código de barras ou nome do produto..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                    disabled={isSaving}
                    autoComplete="off"
                  />

                  {/* Dropdown de Produtos */}
                  {showProductDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProductToSale(product)}
                          className="w-full text-left px-4 py-3 hover:bg-zinc-700 transition border-b border-zinc-700 last:border-b-0"
                        >
                          <div className="text-zinc-100 font-medium">{product.name}</div>
                          <div className="text-xs text-zinc-400">
                            Código: {product.barcode || 'N/A'} | Preço: R${' '}
                            {(product.price_sale || 0).toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção: Itens da Venda */}
              <div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-4">Itens da Venda</h3>

                {items.length === 0 ? (
                  <div className="bg-zinc-800/50 rounded-lg p-8 text-center border border-dashed border-zinc-700">
                    <ShoppingCart className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                    <p className="text-zinc-400">
                      Nenhum item adicionado. Busque um produto para começar.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-zinc-700">
                    <table className="w-full">
                      <thead className="bg-zinc-800 border-b border-zinc-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                            Produto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 w-32">
                            Lote
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 w-20">
                            Qtd
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 w-28">
                            Unitário
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 w-20">
                            Desconto %
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 w-28">
                            Desconto R$
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 w-20">
                            Imposto %
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 w-28">
                            Total
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 w-12">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const lineSubtotal = item.quantity * item.unit_price;
                          const lineDiscount = item.discount_amount || 0;
                          const lineBeforeTax = lineSubtotal - lineDiscount;
                          const lineTax = lineBeforeTax * (item.tax_percent || 0) / 100;
                          const lineTotal = lineBeforeTax + lineTax;

                          return (
                            <tr
                              key={item.id}
                              className="border-b border-zinc-700 hover:bg-zinc-800/50 transition"
                            >
                              <td className="px-4 py-3">
                                <div className="text-zinc-100 font-medium">{item.product?.name}</div>
                                <div className="text-xs text-zinc-500">
                                  Código: {item.product?.barcode || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-zinc-400">
                                {item.batch_id ? (
                                  <span className="inline-block px-2 py-1 bg-pink-600/20 text-pink-300 rounded text-xs">
                                    Lote selecionado
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-xs">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(item.id, { quantity: Number(e.target.value) || 1 })
                                  }
                                  className="w-16 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-zinc-100 text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
                                  disabled={isSaving}
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) =>
                                    updateItem(item.id, { unit_price: Number(e.target.value) || 0 })
                                  }
                                  className="w-24 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-zinc-100 text-right focus:outline-none focus:ring-2 focus:ring-pink-500"
                                  disabled={isSaving}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={item.discount_percent}
                                  onChange={(e) =>
                                    updateItem(item.id, { discount_percent: Number(e.target.value) || 0 })
                                  }
                                  className="w-16 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-zinc-100 text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
                                  disabled={isSaving}
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.discount_amount}
                                  onChange={(e) =>
                                    updateItem(item.id, { discount_amount: Number(e.target.value) || 0 })
                                  }
                                  className="w-24 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-zinc-100 text-right focus:outline-none focus:ring-2 focus:ring-pink-500"
                                  disabled={isSaving}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={item.tax_percent}
                                  onChange={(e) =>
                                    updateItem(item.id, { tax_percent: Number(e.target.value) || 0 })
                                  }
                                  className="w-16 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-zinc-100 text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
                                  disabled={isSaving}
                                />
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-zinc-100">
                                R$ {lineTotal.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-500 hover:text-red-400 transition hover:bg-zinc-700/50 p-1 rounded"
                                  disabled={isSaving}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Seção: Resumo Financeiro */}
              {items.length > 0 && (
                <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 space-y-3">
                  <div className="flex justify-between text-zinc-300">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      R$ {totals.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {totals.discountTotal > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Desconto:</span>
                      <span className="font-semibold">
                        -R$ {totals.discountTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {totals.taxTotal > 0 && (
                    <div className="flex justify-between text-yellow-400">
                      <span>Impostos:</span>
                      <span className="font-semibold">
                        +R$ {totals.taxTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-zinc-700 pt-3 flex justify-between text-lg font-bold text-pink-400">
                    <span>Total:</span>
                    <span>R$ {totals.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Campo: Observações */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre a venda..."
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-6 justify-center">
                <button
                  type="submit"
                  disabled={isSaving || items.length === 0}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Salvando...' : 'Registrar Venda'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/sales')}
                  disabled={isSaving}
                  className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
