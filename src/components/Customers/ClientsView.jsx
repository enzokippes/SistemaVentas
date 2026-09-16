import React, { useState } from 'react';
import { Users, Plus, Search, DollarSign, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export default function ClientsView({ sales }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState([
    { id: 'cli-1', name: 'Don Carlos (Vecino)', phone: '351-555-4321', creditLimit: 25000, currentDebt: 5800, notes: 'Paga los días 5 de cada mes' },
    { id: 'cli-2', name: 'Mariana (Piso 3A)', phone: '351-555-8899', creditLimit: 15000, currentDebt: 2400, notes: 'Paga con transferencia' },
    { id: 'cli-3', name: 'Esteban Ferreyra', phone: '351-555-1122', creditLimit: 10000, currentDebt: 0, notes: 'Al día' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', creditLimit: 10000, notes: '' });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;

    setClients([
      ...clients,
      {
        id: `cli-${Date.now()}`,
        name: newClient.name.trim(),
        phone: newClient.phone.trim(),
        creditLimit: Number(newClient.creditLimit) || 10000,
        currentDebt: 0,
        notes: newClient.notes.trim()
      }
    ]);
    setIsModalOpen(false);
    setNewClient({ name: '', phone: '', creditLimit: 10000, notes: '' });
  };

  const handlePayDebt = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.currentDebt <= 0) return;

    const amountStr = prompt(`Registrar cobro de deuda a ${client.name}. Deuda actual: ${formatCurrency(client.currentDebt)}\n¿Cuánto abona?:`, client.currentDebt.toString());
    const amount = Number(amountStr);
    if (amount > 0) {
      setClients(clients.map(c => {
        if (c.id === clientId) {
          return { ...c, currentDebt: Math.max(0, c.currentDebt - amount) };
        }
        return c;
      }));
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const totalDebt = clients.reduce((acc, c) => acc + c.currentDebt, 0);

  return (
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Clientes Registrados
            </span>
            <Users size={18} color="#2563eb" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700 }}>
            {clients.length}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Total en Cuentas Corrientes (Fiados a cobrar)
            </span>
            <DollarSign size={18} color="#ca8a04" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: '#ca8a04' }}>
            {formatCurrency(totalDebt)}
          </div>
        </div>
      </div>

      {/* Search and Add Client bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div className="barcode-input-wrap" style={{ maxWidth: '380px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            className="barcode-input"
            placeholder="Buscar cliente por nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Clients Table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table className="mockup-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Límite Crédito</th>
              <th style={{ textAlign: 'right' }}>Saldo Pendiente (Deuda)</th>
              <th>Notas</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong style={{ color: '#0f172a' }}>{client.name}</strong>
                </td>
                <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{client.phone || '-'}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(client.creditLimit)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: client.currentDebt > 0 ? '#dc2626' : '#16a34a' }}>
                  {formatCurrency(client.currentDebt)}
                </td>
                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{client.notes || '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  {client.currentDebt > 0 && (
                    <button 
                      className="btn btn-success" 
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                      onClick={() => handlePayDebt(client.id)}
                      title="Registrar cobro parcial o total de deuda"
                    >
                      <DollarSign size={14} />
                      <span>Cobrar Deuda</span>
                    </button>
                  )}
                  {client.currentDebt === 0 && (
                    <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                      ✓ Al día
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Client Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Registrar Nuevo Cliente</h3>
            </div>
            <form onSubmit={handleAddClient}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre y Apellido *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Marcelo Gómez"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: 351-555-1234"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Límite de Cuenta Corriente ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newClient.creditLimit}
                    onChange={(e) => setNewClient({ ...newClient, creditLimit: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notas / Dirección</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Vecino de enfrente, paga quincenal"
                    value={newClient.notes}
                    onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
