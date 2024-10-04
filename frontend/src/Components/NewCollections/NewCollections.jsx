import React, { useEffect, useState } from 'react';
import './NewCollections.css';
import Item from '../Item/Item';

const NewCollections = () => {
  const [new_collection, setNew_Collection] = useState([]);

  useEffect(() => {
    fetch('tienda-backend-gold.vercel.app/newcollections')
      .then((response) => response.json())
      .then((data) => setNew_Collection(data.slice(0, 8))); 
  }, []);

  return (
    <div id='new-collections' className='new-collections'>
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className="collections">
        {new_collection.map((item, i) => (
          <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} />
        ))}
      </div>
    </div>
  );
};

export default NewCollections;
