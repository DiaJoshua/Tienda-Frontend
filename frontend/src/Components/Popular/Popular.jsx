import React, { useEffect, useState } from 'react';
import './Popular.css';
import Item from '../Item/Item';

const Popular = () => {

  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    fetch('tienda-backend-gold.vercel.app/popularincrafts')
    .then((response) => response.json())
    .then((data) => setPopularProducts(data));
  }, [])

  return (
    <div id="popular" className='popular'>
      <h1>POPULAR IN CRAFTS</h1>
      <hr />
      <div className="popular-item">
        {popularProducts.map((item, i) => {
          return <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} />;
        })}
      </div>
    </div>
  );
};

export default Popular;
