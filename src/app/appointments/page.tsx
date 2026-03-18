// src/app/appointments/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Calendar, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTimePtBR, formatDatePtBR } from '@/lib/dateTimeFormatter';

interface Specialist {
  id: string;
  full_name: string;
  specialty?: string;
  color_code?: string;
}

interface Patient {
  id: string;
  full_name: string;
  phone?: string;
}

interface Appointment {
  id: string;
  specialist: Specialist;
  patient: Patient;
  start_time: string;
  end_time: string;
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'falta';
  notes?: string;
  type?: string;
}

type ViewType = 'month' | 'week' | 'day';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');

  // Buscar agendamentos com intervalo baseado na view
  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      try {
        let startDate: Date;
        let endDate: Date;

        if (viewType === 'week') {
          const week = getDaysInWeek(currentDate);
          startDate = week[0];
          endDate = week[6];
        } else if (viewType === 'day') {
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
          endDate = new Date(startDate);
        } else {
          // month
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        }

        // Ensure time boundaries include full days
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const res = await fetch(`/api/appointments?${params}`);
        if (!res.ok) throw new Error('Erro ao buscar agendamentos');

        const { appointments } = await res.json();
        setAppointments(appointments || []);
      } catch (err) {
        console.error('Erro:', err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [currentDate, viewType]);

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      agendado: 'bg-blue-500/20 text-blue-200 border-blue-500',
      confirmado: 'bg-green-500/20 text-green-200 border-green-500',
      concluido: 'bg-gray-500/20 text-gray-200 border-gray-500',
      cancelado: 'bg-red-500/20 text-red-200 border-red-500',
      falta: 'bg-yellow-500/20 text-yellow-200 border-yellow-500',
    };
    return colors[status] || colors.agendado;
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      agendado: 'Agendado',
      confirmado: 'Confirmado',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
      falta: 'Falta',
    };
    return labels[status] || status;
  }

  function formatTime(dateString: string) {
    return formatTimePtBR(dateString);
  }

  function formatDate(dateString: string) {
    return formatDatePtBR(dateString);
  }

  // Retorna cor de texto (preto ou branco) com base na luminância da cor de fundo
  function getContrastColor(hexColor?: string): string {
    if (!hexColor) return '#000000';

    // Normalizar: aceita formatos #RRGGBB ou RRGGBB
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) return '#000000';

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Linearize sRGB
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const R = lin(r);
    const G = lin(g);
    const B = lin(b);

    // Luminância relativa
    const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;

    // Padrão WCAG: se luminância > 0.179, texto escuro é melhor, senão texto claro
    return L > 0.179 ? '#000000' : '#ffffff';
  }

  function getDaysInWeek(date: Date) {
    const week = [];
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay();

    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      week.push(new Date(day));
    }
    return week;
  }

  function getMonthGrid(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of month
    const firstOfMonth = new Date(year, month, 1);
    // Day of week (0 = Sunday)
    const startDay = firstOfMonth.getDay();

    // Start from the previous Sunday (or same day if Sunday)
    const startDate = new Date(firstOfMonth);
    startDate.setDate(firstOfMonth.getDate() - startDay);

    // Build 6 weeks grid (6*7 = 42 cells) to cover all month layouts
    const grid: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      grid.push(d);
    }
    return grid;
  }

  function getAppointmentsForDay(day: Date) {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate.toDateString() === day.toDateString();
    });
  }

  const weekDays = getDaysInWeek(currentDate);
  const monthGrid = getMonthGrid(currentDate);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-zinc-50 flex items-center">
          <Calendar className="w-8 h-8 mr-3 text-pink-500" />
          Agendamentos
        </h2>
        <button
          onClick={() => router.push('/appointments/new')}
          className="flex items-center py-2 px-4 rounded-lg shadow-md text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-zinc-900 transition duration-150"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Novo Agendamento
        </button>
      </header>

      {/* Controles de Vista */}
      <div className="flex items-center justify-between mb-6 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-zinc-800 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <h3 className="text-lg font-semibold text-zinc-50 min-w-40 text-center">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-zinc-800 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewType('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewType === 'month'
                ? 'bg-pink-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewType === 'week'
                ? 'bg-pink-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewType('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewType === 'day'
                ? 'bg-pink-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Dia
          </button>
        </div>
      </div>

      {/* Visualização de Semana */}
      {viewType === 'week' && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          {/* Header com dias */}
          <div className="grid grid-cols-7 gap-px bg-zinc-800">
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 p-4 text-center border-b border-zinc-800"
              >
                <p className="text-xs uppercase text-zinc-400 mb-1">
                  {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-bold ${
                  day.toDateString() === new Date().toDateString()
                    ? 'text-pink-500'
                    : 'text-zinc-100'
                }`}>
                  {day.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Conteúdo dos dias */}
          <div className="grid grid-cols-7 gap-px bg-zinc-800">
            {weekDays.map((day, idx) => {
              const dayAppointments = getAppointmentsForDay(day);
              return (
                <div
                  key={idx}
                  className="bg-zinc-900 min-h-96 p-2 space-y-1"
                >
                  {dayAppointments.length === 0 ? (
                    <p className="text-xs text-zinc-500 p-2">Nenhum agendamento</p>
                  ) : (
                    dayAppointments.map(apt => (
                      <div
                        key={apt.id}
                        onClick={() => router.push(`/appointments/${apt.id}/edit`)}
                        className="p-2 rounded text-xs cursor-pointer hover:opacity-90 transition border"
                        style={{
                          backgroundColor: apt.specialist?.color_code ?? undefined,
                          borderColor: apt.specialist?.color_code ?? undefined,
                          color: getContrastColor(apt.specialist?.color_code),
                        }}
                      >
                        <p className="font-semibold truncate">{formatTime(apt.start_time)}</p>
                        <p className="truncate text-xs opacity-90">{apt.patient.full_name}</p>
                        <p className="truncate text-xs opacity-75">{apt.specialist.full_name}</p>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visualização de Mês */}
      {viewType === 'month' && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-px bg-zinc-800">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((wd) => (
              <div key={wd} className="bg-zinc-900 p-3 text-center border-b border-zinc-800">
                <p className="text-xs uppercase text-zinc-400">{wd}</p>
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-px bg-zinc-800">
            {monthGrid.map((day, idx) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              return (
                <div
                  key={idx}
                  className={`bg-zinc-900 min-h-40 p-2 ${isCurrentMonth ? '' : 'opacity-40'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-sm font-medium ${day.toDateString() === new Date().toDateString() ? 'text-pink-500' : 'text-zinc-200'}`}>
                      {day.getDate()}
                    </span>
                  </div>

                  {dayAppointments.length === 0 ? (
                    <p className="text-xs text-zinc-500">&nbsp;</p>
                  ) : (
                    <div className="space-y-1">
                      {dayAppointments.map(apt => (
                        <div
                          key={apt.id}
                          onClick={() => router.push(`/appointments/${apt.id}/edit`) }
                          className="p-1 rounded text-xs cursor-pointer hover:opacity-90 transition border"
                          style={{
                              backgroundColor: apt.specialist?.color_code ?? undefined,
                              borderColor: apt.specialist?.color_code ?? undefined,
                              color: getContrastColor(apt.specialist?.color_code),
                            }}
                        >
                          <p className="font-semibold truncate">{formatTime(apt.start_time)}</p>
                          <p className="truncate text-xs opacity-90">{apt.patient.full_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visualização de Lista (Padrão) */}
      {viewType !== 'week' && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-zinc-700">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Especialista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-pink-500">
                      Carregando agendamentos...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-zinc-400">
                      Nenhum agendamento neste período
                    </td>
                  </tr>
                ) : (
                  appointments.map(apt => (
                    <tr key={apt.id} className="hover:bg-zinc-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">
                        {formatDate(apt.start_time)} {formatTime(apt.start_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                        {apt.patient.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                        {apt.specialist.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                        <button
                          onClick={() => router.push(`/appointments/${apt.id}/edit`)}
                          className="text-pink-500 hover:text-pink-400 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Deseja deletar este agendamento?')) {
                              fetch(`/api/appointments/${apt.id}`, { method: 'DELETE' })
                                .then(() => {
                                  setAppointments(prev => prev.filter(a => a.id !== apt.id));
                                });
                            }
                          }}
                          className="text-pink-500 hover:text-red-400 transition"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
