import React from 'react';

const partners = [
  {
    name: 'Shopify',
    logo: (
      <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.5 4.5L12 0L2.5 4.5L12 9L21.5 4.5Z" fill="#95BF47"/>
        <path d="M2.5 4.5V19.5L12 24V9L2.5 4.5Z" fill="#5E8E3E"/>
        <path d="M21.5 4.5V19.5L12 24V9L21.5 4.5Z" fill="#5E8E3E"/>
      </svg>
    )
  },
  {
    name: 'Slack',
    logo: (
      <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 15.5C5.5 16.6 4.6 17.5 3.5 17.5C2.4 17.5 1.5 16.6 1.5 15.5C1.5 14.4 2.4 13.5 3.5 13.5H5.5V15.5Z" fill="#E01E5A"/>
        <path d="M6.5 15.5C6.5 14.4 7.4 13.5 8.5 13.5C9.6 13.5 10.5 14.4 10.5 15.5V20.5C10.5 21.6 9.6 22.5 8.5 22.5C7.4 22.5 6.5 21.6 6.5 20.5V15.5Z" fill="#E01E5A"/>
        <path d="M8.5 5.5C7.4 5.5 6.5 4.6 6.5 3.5C6.5 2.4 7.4 1.5 8.5 1.5C9.6 1.5 10.5 2.4 10.5 3.5V5.5H8.5Z" fill="#36C5F0"/>
        <path d="M8.5 6.5C9.6 6.5 10.5 7.4 10.5 8.5C10.5 9.6 9.6 10.5 8.5 10.5H3.5C2.4 10.5 1.5 9.6 1.5 8.5C1.5 7.4 2.4 6.5 3.5 6.5H8.5Z" fill="#36C5F0"/>
        <path d="M18.5 8.5C19.6 8.5 20.5 9.4 20.5 10.5C20.5 11.6 19.6 12.5 18.5 12.5C17.4 12.5 16.5 11.6 16.5 10.5V8.5H18.5Z" fill="#2EB67D"/>
        <path d="M17.5 8.5C17.5 7.4 16.6 6.5 15.5 6.5C14.4 6.5 13.5 7.4 13.5 8.5V3.5C13.5 2.4 14.4 1.5 15.5 1.5C16.6 1.5 17.5 2.4 17.5 3.5V8.5Z" fill="#2EB67D"/>
        <path d="M15.5 18.5C16.6 18.5 17.5 19.4 17.5 20.5C17.5 21.6 16.6 22.5 15.5 22.5C14.4 22.5 13.5 21.6 13.5 20.5V18.5H15.5Z" fill="#ECB22E"/>
        <path d="M15.5 17.5C14.4 17.5 13.5 16.6 13.5 15.5C13.5 14.4 14.4 13.5 15.5 13.5H20.5C21.6 13.5 22.5 14.4 22.5 15.5C22.5 16.6 21.6 17.5 20.5 17.5H15.5Z" fill="#ECB22E"/>
      </svg>
    )
  },
  {
    name: 'Zapier',
    logo: (
      <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L0 12L12 24L24 12L12 0Z" fill="#FF4A00"/>
        <path d="M12 4L4 12L12 20L20 12L12 4Z" fill="white"/>
      </svg>
    )
  }
];

const Partners = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Partners</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center">
          {partners.map((partner) => (
            <div key={partner.name} className="p-6 hover:scale-105 transition-transform duration-300">
              {partner.logo}
              <p className="text-center mt-4 text-gray-600">{partner.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners; 