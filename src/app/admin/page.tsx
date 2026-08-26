'use client';

import { useEffect, useState } from 'react';
import { dbService } from '@/lib/supabase';
import { User, Mail, Phone, Calendar, Search } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      const res = await dbService.getAllProfiles();
      if (res.data) {
        setUsers(res.data);
      }
      setLoading(false);
    }
    
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.phone?.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Üye Listesi</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Sisteme kayıtlı olan tüm kullanıcıları ve bilgilerini buradan görebilirsiniz.
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500" />
          </div>
          <input
            type="text"
            placeholder="İsim, E-posta veya Telefon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-950/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  E-posta
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Telefon
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Rol
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    Kullanıcılar yükleniyor...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    Kayıtlı kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-neutral-400" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">{user.full_name || 'İsimsiz Kullanıcı'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-neutral-300">
                        <Mail className="h-3.5 w-3.5 text-neutral-500 mr-2" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-neutral-300">
                        <Phone className="h-3.5 w-3.5 text-neutral-500 mr-2" />
                        {user.phone || <span className="text-neutral-600 italic">Girmedi</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-neutral-400">
                        <Calendar className="h-3.5 w-3.5 text-neutral-500 mr-2" />
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_admin ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-neutral-800 text-neutral-400">
                          Üye
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
