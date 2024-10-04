import React, { useEffect, useState } from 'react';
import './RelatedProducts.css';
import Item from '../Item/Item';

const RelatedProducts = ({ category }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch(`tienda-backend-gold.vercel.app/relatedproducts/${category}`);
        if (response.ok) {
          const data = await response.json();
          setRelatedProducts(data);
        } else {
          console.error('Failed to fetch related products:', response.status);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
    };

    fetchRelatedProducts();
  }, [category]);

  return (
    <div className='relatedproducts'>
      <h1>Related Products</h1>
      <hr />
      <div className="relatedproducts-item">
        {relatedProducts.map((item) => (
          <Item
            key={item.id}
            id={item.id}
            name={item.name}
            image={item.image}
            new_price={item.new_price}
          />
        ))}
      </div>
    </div>
  );
}

export default RelatedProducts;
