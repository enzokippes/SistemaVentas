import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, DollarSign, X, Check, Trash2, Phone, Pencil } from 'lucide-react';
import ModalBackdrop from '../Common/ModalBackdrop';

export default function ClientsView({ 
  clients = [], 
  onAddClient, 
  onUpdateClient, 
  onDeleteClient, 
  onDeleteBatchClients,
  onPayDebt 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', creditLimit: 15000, unlimitedCredit: false, notes: '' });
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Edit client modal state
  const [editingClient, setEditingClient] = useState(null);

  // Payment modal state
  const [payingClient, setPayingClient] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('efectivo');
  const [paymentSuccessToast, setPaymentSuccessToast] = useState(null);

  const newClientInputRef = useRef(null);
  const editClientInputRef = useRef(null);
  const payAmountInputRef = useRef(null);

  // Ensure inputs gain focus immediately on modal open
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => newClientInputRef.current?.focus(), 60);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (editingClient) {
      setTimeout(() => {
        editClientInputRef.current?.focus();
        editClientInputRef.current?.select();
      }, 60);
    }
  }, [editingClient]);

  useEffect(() => {
    if (payingClient) {
      setTimeout(() => {
        payAmountInputRef.current?.focus();
        payAmountInputRef.current?.select();
      }, 60);
    }
  }, [payingClient]);

  useEffect(() => {
    if (paymentSuccessToast) {
      const timer = setTimeout(() => {
        setPaymentSuccessToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccessToast]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;

    onAddClient?.({
      name: newClient.name.trim(),
      phone: newClient.phone.trim(),
      creditLimit: newClient.unlimitedCredit ? null : (Number(newClient.creditLimit) || 15000),
      unlimitedCredit: Boolean(newClient.unlimitedCredit),
      currentDebt: 0,
      notes: newClient.notes.trim()
    });

    setIsModalOpen(false);
    setNewClient({ name: '', phone: '', creditLimit: 15000, unlimitedCredit: false, notes: '' });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingClient || !editingClient.name.trim()) return;

    onUpdateClient?.(editingClient.id, {
      name: editingClient.name.trim(),
      phone: (editingClient.phone || '').trim(),
      creditLimit: editingClient.unlimitedCredit ? null : (Number(editingClient.creditLimit) || 0),
      unlimitedCredit: Boolean(editingClient.unlimitedCredit),
      currentDebt: Number(editingClient.currentDebt) || 0,
      notes: (editingClient.notes || '').trim()
    });

    setEditingClient(null);
  };

  const openPayModal = (client) => {
    setPayingClient(client);
    setPayAmount(client.currentDebt.toString());
    setPayMethod('efectivo');
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!payingClient) return;

    const amount = Number(payAmount);
    if (amount > 0) {
      onPayDebt?.(payingClient.id, amount, payMethod);
      const clientName = payingClient.name;
      const methodLabel = payMethod === 'efectivo' ? 'al cajón de efectivo de la caja abierta' : 'a cobros por transferencia del turno';
      setPaymentSuccessToast({
        amount,
        clientName,
        method: payMethod,
        message: `¡Cobro de ${formatCurrency(amount)} a "${clientName}" registrado con éxito! Se sumó ${methodLabel}.`
      });
      setPayingClient(null);
      setPayAmount('');
    }
  };

  const handleDelete = (clientId, clientName) => {
    if (window.confirm(`¿Eliminar al cliente "${clientName}"?`)) {
      onDeleteClient?.(clientId);
      const next = new Set(selectedIds);
      next.delete(clientId);
      setSelectedIds(next);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const allFilteredSelected = filteredClients.length > 0 && filteredClients.every(c => selectedIds.has(c.id));
  const someFilteredSelected = filteredClients.some(c => selectedIds.has(c.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filteredClients.forEach(c => next.delete(c.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredClients.forEach(c => next.add(c.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBatchDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (window.confirm(`¿Estás seguro de eliminar los ${count} clientes seleccionados?`)) {
      if (onDeleteBatchClients) {
        onDeleteBatchClients(Array.from(selectedIds));
      } else {
        selectedIds.forEach(id => onDeleteClient(id));
      }
      setSelectedIds(new Set());
    }
  };

  const totalDebt = clients.reduce((acc, c) => acc + (c.currentDebt || 0), 0);
  const debtorsCount = clients.filter(c => (c.currentDebt || 0) > 0).length;

  return (
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header & Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Total Clientes Registrados
            </span>
            <Users size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {clients.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clientes en base de datos local</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Cuentas Corrientes (Fiados a cobrar)
            </span>
            <DollarSign size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
            {formatCurrency(totalDebt)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 500 }}>
            {debtorsCount} {debtorsCount === 1 ? 'cliente con saldo pendiente' : 'clientes con saldo pendiente'}
          </span>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="barcode-input-wrap" style={{ maxWidth: '380px', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="barcode-input"
            placeholder="Buscar por nombre, teléfono o nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Batch Action Floating Bar */}
      {selectedIds.size > 0 && (
        <div 
          style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '2px solid var(--primary)', 
            borderRadius: 'var(--radius-md)', 
            padding: '0.75rem 1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: 'var(--modal-shadow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {selectedIds.size} cliente{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={() => setSelectedIds(new Set())}
            >
              <X size={14} />
              <span>Deseleccionar todos</span>
            </button>
          </div>

          <button 
            className="btn btn-danger" 
            onClick={handleBatchDelete}
            style={{ backgroundColor: 'var(--danger)', color: '#ffffff', padding: '0.5rem 1.25rem' }}
          >
            <Trash2 size={16} />
            <span>Eliminar {selectedIds.size} Seleccionado{selectedIds.size > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}

      {/* Clients Table */}
      <div className="data-table-container" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={el => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                  onChange={handleToggleSelectAll}
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  title="Seleccionar todos los clientes visibles"
                />
              </th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Límite Crédito</th>
              <th style={{ textAlign: 'right' }}>Saldo Pendiente</th>
              <th>Notas</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No se encontraron clientes registrados con ese criterio.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const hasDebt = (client.currentDebt || 0) > 0;
                const isSelected = selectedIds.has(client.id);
                return (
                  <tr 
                    key={client.id}
                    style={{ 
                      backgroundColor: isSelected ? 'var(--bg-selected)' : undefined,
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(client.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.95rem' }}>{client.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {client.id}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {client.phone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} color="var(--accent-blue)" /> {client.phone}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sin teléfono</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {(client.unlimitedCredit || client.creditLimit === null) ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 700, padding: '2px 8px', background: 'rgba(37,99,235,0.08)', borderRadius: '4px', fontSize: '0.8rem' }}>
                          ∞ Ilimitado
                        </span>
                      ) : (
                        formatCurrency(client.creditLimit)
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: hasDebt ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {formatCurrency(client.currentDebt)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                      {client.notes || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
                        {/* Botón Editar Cliente */}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 9px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setEditingClient({ 
                            ...client, 
                            unlimitedCredit: Boolean(client.unlimitedCredit || client.creditLimit === null),
                            creditLimit: client.creditLimit ?? 15000
                          })}
                          title="Editar información del cliente"
                        >
                          <Pencil size={13} />
                          <span>Editar</span>
                        </button>

                        {/* Botón Cobrar Deuda */}
                        {hasDebt ? (
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => openPayModal(client)}
                            title="Cobrar o abonar saldo de cuenta corriente"
                          >
                            <DollarSign size={13} />
                            <span>Cobrar</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--accent-green)', fontSize: '0.75rem', fontWeight: 600, padding: '3px 7px', background: 'var(--success-light)', border: '1px solid var(--success-border)', borderRadius: '4px' }}>
                            ✓ Al día
                          </span>
                        )}

                        {/* Botón Eliminar Cliente */}
                        <button
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                          onClick={() => handleDelete(client.id, client.name)}
                          title="Eliminar cliente"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Client Modal */}
      {isModalOpen && (
        <ModalBackdrop onClose={() => setIsModalOpen(false)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            onMouseDown={(e) => e.stopPropagation()} 
            style={{ maxWidth: '460px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--accent-blue)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Registrar Nuevo Cliente</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre y Apellido *</label>
                  <input
                    ref={newClientInputRef}
                    type="text"
                    className="form-input"
                    placeholder="Ej: Marcelo Gómez (Piso 3A)"
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Límite de Cuenta Corriente ($)</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', color: newClient.unlimitedCredit ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(newClient.unlimitedCredit)}
                        onChange={(e) => setNewClient({ ...newClient, unlimitedCredit: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                      />
                      <strong>Sin límite (Ilimitado ∞)</strong>
                    </label>
                  </div>
                  {newClient.unlimitedCredit ? (
                    <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                      Crédito Ilimitado (sin tope de fiado)
                    </div>
                  ) : (
                    <input
                      type="number"
                      className="form-input"
                      value={newClient.creditLimit}
                      onChange={(e) => setNewClient({ ...newClient, creditLimit: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      placeholder="Ej: 15000"
                    />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Notas / Indicaciones</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Paga los viernes quincenales, vecino de enfrente..."
                    value={newClient.notes}
                    onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>Guardar Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </ModalBackdrop>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <ModalBackdrop onClose={() => setEditingClient(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            onMouseDown={(e) => e.stopPropagation()} 
            style={{ maxWidth: '460px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil size={18} color="var(--accent-blue)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Editar Cliente - {editingClient.name}</h3>
              </div>
              <button onClick={() => setEditingClient(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre y Apellido *</label>
                  <input
                    ref={editClientInputRef}
                    type="text"
                    className="form-input"
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
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
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Límite Crédito ($)</label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none', color: editingClient.unlimitedCredit ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(editingClient.unlimitedCredit)}
                          onChange={(e) => setEditingClient({ ...editingClient, unlimitedCredit: e.target.checked })}
                          style={{ cursor: 'pointer' }}
                        />
                        <strong>Ilimitado ∞</strong>
                      </label>
                    </div>
                    {editingClient.unlimitedCredit ? (
                      <div style={{ padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', color: 'var(--primary)', fontWeight: 600, fontSize: '0.82rem' }}>
                        Sin límite (∞)
                      </div>
                    ) : (
                      <input
                        type="number"
                        className="form-input"
                        value={editingClient.creditLimit ?? 15000}
                        onChange={(e) => setEditingClient({ ...editingClient, creditLimit: e.target.value })}
                        onFocus={(e) => e.target.select()}
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Saldo Deuda Actual ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingClient.currentDebt}
                      onChange={(e) => setEditingClient({ ...editingClient, currentDebt: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      style={{ 
                        color: Number(editingClient.currentDebt) > 0 ? 'var(--accent-red)' : 'var(--accent-green)', 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: 700 
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas / Indicaciones</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Paga quincenal, vecino de enfrente..."
                    value={editingClient.notes || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingClient(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </ModalBackdrop>
      )}

      {/* Pay Debt Modal */}
      {payingClient && (
        <ModalBackdrop onClose={() => setPayingClient(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            onMouseDown={(e) => e.stopPropagation()} 
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} color="var(--accent-green)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Cobrar Deuda - {payingClient.name}</h3>
              </div>
              <button onClick={() => setPayingClient(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmPayment}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Saldo Pendiente Total</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: 'var(--accent-red)', marginTop: '0.25rem' }}>
                    {formatCurrency(payingClient.currentDebt)}
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Monto que abona ($) *</label>
                    <button
                      type="button"
                      onClick={() => setPayAmount(payingClient.currentDebt.toString())}
                      style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', color: 'var(--accent-green)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Pagar Totalidad
                    </button>
                  </div>
                  <input
                    ref={payAmountInputRef}
                    type="number"
                    className="form-input"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    max={payingClient.currentDebt}
                    min="1"
                    autoFocus
                    required
                    style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  />
                  {Number(payAmount) > 0 && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Saldo restante: <strong>{formatCurrency(Math.max(0, payingClient.currentDebt - Number(payAmount)))}</strong>
                    </div>
                  )}
                </div>

                {/* Medio de Pago Selector */}
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">¿Cómo abona el cliente? *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setPayMethod('efectivo')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        transition: 'all 0.15s ease',
                        border: payMethod === 'efectivo' ? '2px solid var(--accent-green)' : '1px solid var(--border)',
                        background: payMethod === 'efectivo' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                        color: payMethod === 'efectivo' ? 'var(--accent-green)' : 'var(--text-secondary)'
                      }}
                    >
                      <span>💵 Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('transferencia')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        transition: 'all 0.15s ease',
                        border: payMethod === 'transferencia' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: payMethod === 'transferencia' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-input)',
                        color: payMethod === 'transferencia' ? 'var(--primary)' : 'var(--text-secondary)'
                      }}
                    >
                      <span>📲 Transferencia</span>
                    </button>
                  </div>

                  <div style={{ 
                    marginTop: '0.65rem', 
                    padding: '0.6rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.8rem',
                    background: payMethod === 'efectivo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                    border: `1px solid ${payMethod === 'efectivo' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.25)'}`,
                    color: payMethod === 'efectivo' ? 'var(--accent-green)' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <span>💰</span>
                    <span>
                      {payMethod === 'efectivo' 
                        ? 'Este dinero se sumará inmediatamente al cajón de efectivo de la caja abierta (F4).' 
                        : 'Este dinero se sumará a los cobros por transferencia del turno actual (F4).'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPayingClient(null)}>Cancelar</button>
                <button type="submit" className="btn btn-success" disabled={!payAmount || Number(payAmount) <= 0}>
                  <Check size={16} />
                  <span>Registrar Cobro ({formatCurrency(Number(payAmount) || 0)})</span>
                </button>
              </div>
            </form>
          </div>
        </ModalBackdrop>
      )}

      {/* Floating Success Toast */}
      {paymentSuccessToast && (
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid #16a34a',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            minWidth: '380px',
            maxWidth: '90vw',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setPaymentSuccessToast(null)}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(22, 163, 74, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
            <Check size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              ¡Cobro de Deuda Registrado!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {paymentSuccessToast.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
