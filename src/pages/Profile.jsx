import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft,
  Save,
  User,
  Key
} from 'lucide-react';
import { authService } from '../services/auth';

const Profile = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validar senha nova se fornecida
      if (formData.newPassword) {
        if (formData.newPassword.length < 6) {
          throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
      }

      // Atualizar perfil
      await authService.updateProfile({
        name: formData.name,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setSuccess('Perfil atualizado com sucesso!');
      
      // Limpar campos de senha
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nome
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-4">Alterar Senha</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Senha Atual
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <Input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Nova Senha
                      </label>
                      <Input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Confirmar Nova Senha
                      </label>
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;