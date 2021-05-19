import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
  const [stock, setStock] = useState<Stock[]>([]);

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`products/${productId}`);

      const productAlreadyInCart = cart.find(
        (product) => product.id === response.data.id
      );

      if (!productAlreadyInCart) {
        const newItem = {
          ...response.data,
          amount: 1,
        };
        const updatedCart = [...cart, newItem];
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        const amount = productAlreadyInCart.amount + 1;
        updateProductAmount({ productId, amount });
      }
    } catch (error) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productAlreadyInCart = cart.find(
        (product) => product.id === productId
      );
      if (!productAlreadyInCart) {
        throw new Error();
      }
      const updatedCart = cart.filter((product) => product.id !== productId);
      setCart(updatedCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`stock/${productId}`);
      if (amount > response.data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (amount < 1) {
        throw new Error();
      }

      const updatedCart = cart.map((product) => {
        product.amount = product.id === productId ? amount : product.amount;
        return product;
      });
      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch (error) {
      toast.error("Erro na alteração de quantidade do produto");
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
