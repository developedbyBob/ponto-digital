const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date);
  };
  
  export const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (!isValidDate(date)) {
        console.warn('Data inválida:', dateString);
        return '--:--';
      }
  
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '--:--';
    }
  };
  
  export const formatTime = (dateString) => {
    try {
      if (!dateString) {
        console.warn('Data não fornecida');
        return '--:--';
      }
  
      const date = new Date(dateString);
      if (!isValidDate(date)) {
        console.warn('Data inválida:', dateString);
        return '--:--';
      }
  
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Erro ao formatar hora:', error);
      return '--:--';
    }
  };
  
  export const formatDate = (dateString) => {
    try {
      if (!dateString) {
        console.warn('Data não fornecida');
        return 'Data inválida';
      }
  
      const date = new Date(dateString);
      if (!isValidDate(date)) {
        console.warn('Data inválida:', dateString);
        return 'Data inválida';
      }
  
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
      }).format(date);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };
  
  export const formatMonthYear = (dateString) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (!isValidDate(date)) return '';
  
      return new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Erro ao formatar mês/ano:', error);
      return '';
    }
  };