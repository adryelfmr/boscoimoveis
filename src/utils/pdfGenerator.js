import jsPDF from 'jspdf';

export function gerarPDFImovel(imovel) {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFillColor(30, 58, 138);
  pdf.rect(0, 0, 210, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text('Bosco Imóveis', 105, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text('Ficha Técnica do Imóvel', 105, 30, { align: 'center' });
  
  // Resetar cor
  pdf.setTextColor(0, 0, 0);
  
  // Conteúdo
  let y = 50;
  
  pdf.setFontSize(16);
  pdf.text(imovel.titulo, 20, y);
  y += 10;
  
  pdf.setFontSize(12);
  pdf.text(`Código: ${imovel.codigo || imovel.$id}`, 20, y);
  y += 10;
  
  pdf.setFontSize(20);
  pdf.setTextColor(30, 58, 138);
  pdf.text(`R$ ${imovel.preco.toLocaleString('pt-BR')}`, 20, y);
  pdf.setTextColor(0, 0, 0);
  y += 15;
  
  // Características
  pdf.setFontSize(14);
  pdf.text('Características:', 20, y);
  y += 8;
  
  pdf.setFontSize(11);
  const caracteristicas = [
    `Tipo: ${imovel.tipoImovel}`,
    `Cidade: ${imovel.cidade}`,
    `Bairro: ${imovel.bairro}`,
    imovel.area && `Área: ${imovel.area}m²`,
    imovel.numeroQuartos && `Quartos: ${imovel.numeroQuartos}`,
    imovel.numeroBanheiros && `Banheiros: ${imovel.numeroBanheiros}`,
    imovel.vagas && `Vagas: ${imovel.vagas}`,
  ].filter(Boolean);
  
  caracteristicas.forEach(item => {
    pdf.text(`• ${item}`, 25, y);
    y += 6;
  });
  
  // Descrição
  if (imovel.descricao) {
    y += 5;
    pdf.setFontSize(14);
    pdf.text('Descrição:', 20, y);
    y += 8;
    
    pdf.setFontSize(10);
    const descricaoLines = pdf.splitTextToSize(imovel.descricao, 170);
    pdf.text(descricaoLines, 20, y);
    y += descricaoLines.length * 5;
  }
  
  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Contato: (62) 99404-5111 | bosco.mr@hotmail.com', 105, 280, { align: 'center' });
  pdf.text('www.boscoimoveis.app', 105, 286, { align: 'center' });
  
  // Salvar
  pdf.save(`imovel_${imovel.codigo || imovel.$id}.pdf`);
}