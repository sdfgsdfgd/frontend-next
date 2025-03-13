// Re-export the useAuth hook from our AuthContext
import { useAuth } from "../context/AuthContext";

// Export both as named export and default export for backward compatibility
export { useAuth };
export default useAuth; 