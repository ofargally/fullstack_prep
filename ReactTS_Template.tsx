import React, {
  useState,
  useReducer,
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// --- Types/Interfaces ---
interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
}

interface AppState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
}

interface AppContextProps extends AppState {
  fetchItems: () => void;
  addItem: (item: Omit<Item, "id">) => Promise<void>;
}

// --- Mock API Service ---
const MOCK_API_DELAY = 500;
let mockItems: Item[] = [
  {
    id: "1",
    name: "Laptop",
    price: 1200,
    description: "High-performance laptop",
  },
  { id: "2", name: "Keyboard", price: 75, description: "Mechanical keyboard" },
  { id: "3", name: "Mouse", price: 25, description: "Wireless mouse" },
];

const api = {
  getItems: (): Promise<Item[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockItems]);
      }, MOCK_API_DELAY);
    });
  },
  createItem: (newItemData: Omit<Item, "id">): Promise<Item> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (newItemData.price <= 0) {
          return reject(new Error("Price must be positive"));
        }
        const newItem: Item = {
          ...newItemData,
          id: Date.now().toString(),
        };
        mockItems.push(newItem);
        resolve(newItem);
      }, MOCK_API_DELAY);
    });
  },
};

// --- State Management (Reducer & Context) ---
enum ActionType {
  FETCH_START = "FETCH_START",
  FETCH_SUCCESS = "FETCH_SUCCESS",
  FETCH_ERROR = "FETCH_ERROR",
  ADD_ITEM_START = "ADD_ITEM_START",
  ADD_ITEM_SUCCESS = "ADD_ITEM_SUCCESS",
  ADD_ITEM_ERROR = "ADD_ITEM_ERROR",
}

type Action =
  | { type: ActionType.FETCH_START }
  | { type: ActionType.FETCH_SUCCESS; payload: Item[] }
  | { type: ActionType.FETCH_ERROR; payload: string }
  | { type: ActionType.ADD_ITEM_START }
  | { type: ActionType.ADD_ITEM_SUCCESS; payload: Item }
  | { type: ActionType.ADD_ITEM_ERROR; payload: string };

const initialState: AppState = {
  items: [],
  isLoading: false,
  error: null,
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case ActionType.FETCH_START:
    case ActionType.ADD_ITEM_START:
      return { ...state, isLoading: true, error: null };
    case ActionType.FETCH_SUCCESS:
      return { ...state, isLoading: false, items: action.payload, error: null };
    case ActionType.FETCH_ERROR:
    case ActionType.ADD_ITEM_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    case ActionType.ADD_ITEM_SUCCESS:
      return {
        ...state,
        isLoading: false,
        items: [...state.items, action.payload],
        error: null,
      };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const fetchItems = useCallback(async () => {
    dispatch({ type: ActionType.FETCH_START });
    try {
      const items = await api.getItems();
      dispatch({ type: ActionType.FETCH_SUCCESS, payload: items });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      dispatch({ type: ActionType.FETCH_ERROR, payload: errorMessage });
    }
  }, []);

  const addItem = useCallback(async (itemData: Omit<Item, "id">) => {
    dispatch({ type: ActionType.ADD_ITEM_START });
    try {
      const newItem = await api.createItem(itemData);
      dispatch({ type: ActionType.ADD_ITEM_SUCCESS, payload: newItem });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during add";
      dispatch({ type: ActionType.ADD_ITEM_ERROR, payload: errorMessage });
      throw err; // Allow the form component to catch the error
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const contextValue: AppContextProps = {
    ...state,
    fetchItems,
    addItem,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

// --- Components ---
const ItemList: React.FC = () => {
  const { items, isLoading, error, fetchItems } = useAppContext();

  return (
    <div className="mt-8 p-4 border border-gray-300 rounded-lg shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">Items List</h2>
        <button
          onClick={fetchItems}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Refreshing..." : "Refresh List"}
        </button>
      </div>

      {isLoading && items.length === 0 && (
        <p className="text-center text-gray-500">Loading items...</p>
      )}
      {error && <p className="text-center text-red-500">Error: {error}</p>}
      {!isLoading && !error && items.length === 0 && (
        <p className="text-center text-gray-500">No items found.</p>
      )}

      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="p-3 border border-gray-200 rounded-md bg-gray-50 flex justify-between items-center"
            >
              <div>
                <span className="font-medium text-gray-800">{item.name}</span>
                {item.description && (
                  <span className="text-sm text-gray-600 ml-2">
                    - {item.description}
                  </span>
                )}
              </div>
              <span className="text-lg font-semibold text-green-600">
                ${item.price.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AddItemForm: React.FC = () => {
  const { addItem, isLoading, error: contextError } = useAppContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Item name is required.");
      return;
    }
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setFormError("Please enter a valid positive price.");
      return;
    }

    setIsSubmitting(true);

    const newItemData: Omit<Item, "id"> = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceValue,
    };

    try {
      await addItem(newItemData);
      setName("");
      setDescription("");
      setPrice("");
      setFormError(null);
    } catch (err) {
      console.error("Form submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProcessing = isSubmitting || isLoading;

  return (
    <div className="mt-8 p-6 border border-gray-300 rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Add New Item
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {contextError && !isProcessing && (
          <p className="text-red-500 text-sm mb-4">Error: {contextError}</p>
        )}
        {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}

        <div>
          <label
            htmlFor="itemName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="itemName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isProcessing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor="itemDescription"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (Optional)
          </label>
          <input
            type="text"
            id="itemDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isProcessing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor="itemPrice"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="itemPrice"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            step="0.01"
            min="0.01"
            disabled={isProcessing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Adding Item..." : "Add Item"}
        </button>
      </form>
    </div>
  );
};

// --- Main App Component ---
function App() {
  return (
    <AppProvider>
      <div className="container mx-auto p-4 font-sans max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800">React + TS Store</h1>
          <p className="text-lg text-gray-600 mt-2">
            Using Context, Reducer, and Mock API
          </p>
        </header>

        <main>
          <AddItemForm />
          <ItemList />
        </main>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>React Template &copy; 2025</p>
        </footer>
      </div>
    </AppProvider>
  );
}

export default App;
