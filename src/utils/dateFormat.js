const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const formatDateTime = (dateString) => {
  try {
    if (!dateString) {
      console.warn('Data não fornecida para formatDateTime');
      return '--:--';
    }

    const date = new Date(dateString);
    if (!isValidDate(date)) {
      console.warn('Data inválida em formatDateTime:', dateString);
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
    console.error('Erro ao formatar data em formatDateTime:', error);
    return '--:--';
  }
};

export const formatTime = (dateString) => {
  try {
    if (!dateString) {
      console.warn('Data não fornecida para formatTime');
      return '--:--';
    }

    const date = new Date(dateString);
    if (!isValidDate(date)) {
      console.warn('Data inválida em formatTime:', dateString);
      return '--:--';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Erro ao formatar hora em formatTime:', error);
    return '--:--';
  }
};

export const formatDate = (dateString) => {
  try {
    if (!dateString) {
      console.warn('Data não fornecida para formatDate');
      return 'Data inválida';
    }

    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (!isValidDate(date)) {
      console.warn('Data inválida em formatDate:', dateString);
      return 'Data inválida';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    }).format(date);
  } catch (error) {
    console.error('Erro ao formatar data em formatDate:', error);
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
    console.error('Erro ao formatar mês/ano em formatMonthYear:', error);
    return '';
  }
};