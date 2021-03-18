import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // localStorage.removeItem('@RocketShoes:cart')
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if(storagedCart) {
      console.log(JSON.parse(storagedCart))
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartProduct = cart.find(product => product.id === productId);
      if(cartProduct) {
        updateProductAmount({ productId, amount: cartProduct.amount + 1 });
        return;
      }

      const response = await api.get<Product>(`/products/${productId}`);
      const newProduct = { ...response.data, amount: 1 }
      setCart(oldState => [...oldState, newProduct]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.filter(product => product.id === productId);
      if(!product.length) {
        throw new Error('');
      }

      const newCart = cart.filter(product => product.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      const itemInStock = response.data;
      if(itemInStock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return; 
      }

      if(amount < 1) {
        return;
      }

      const updatedCart = cart.map(product => {
        if(product.id === productId) {
          product.amount = amount;
        }

        return product;
      });

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
