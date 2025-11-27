/**
 * Sistema de notificações push
 */

export const notifications = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Navegador não suporta notificações');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  send(title, options = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });
    }
  },

  novoImovel(imovel) {
    this.send('Novo Imóvel Disponível! 🏡', {
      body: `${imovel.titulo} - ${formatPrice(imovel.preco)}`,
      tag: `imovel-${imovel.$id}`,
      data: { url: `/detalhes?id=${imovel.$id}` },
    });
  },

  reducaoPreco(imovel, precoAntigo) {
    this.send('Preço Reduzido! 🔥', {
      body: `${imovel.titulo} - De ${formatPrice(precoAntigo)} por ${formatPrice(imovel.preco)}`,
      tag: `preco-${imovel.$id}`,
      data: { url: `/detalhes?id=${imovel.$id}` },
    });
  },
};