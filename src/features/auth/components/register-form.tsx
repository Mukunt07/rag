"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { motion, Variants } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { data, error } = await signUp.email({
      email,
      password,
      name,
    });

    setIsLoading(false);

    if (error) {
      alert(error.message || "Something went wrong during registration.");
    } else {
      router.push("/dashboard");
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Create an account
        </h2>
        <p className="text-base text-zinc-500 dark:text-zinc-400 mt-2">
          Start organizing your intelligent knowledge base.
        </p>
      </motion.div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <motion.div variants={itemVariants} className="space-y-2 group">
            <Label htmlFor="name" className="font-medium text-zinc-900 dark:text-zinc-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
              Full Name
            </Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 px-4 shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:border-indigo-500 dark:focus-visible:border-indigo-400 rounded-lg transition-all duration-300"
              required 
              disabled={isLoading}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2 group">
            <Label htmlFor="email" className="font-medium text-zinc-900 dark:text-zinc-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
              Email
            </Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-4 shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:border-indigo-500 dark:focus-visible:border-indigo-400 rounded-lg transition-all duration-300"
              required 
              disabled={isLoading}
            />
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-2 group">
            <Label htmlFor="password" className="font-medium text-zinc-900 dark:text-zinc-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
              Password
            </Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:border-indigo-500 dark:focus-visible:border-indigo-400 rounded-lg transition-all duration-300 pr-10"
                required 
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
              </button>
            </div>
          </motion.div>
        </div>
        
        <motion.div variants={itemVariants}>
          <Button 
            type="submit" 
            className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg font-medium shadow-md transition-all duration-300 hover:shadow-lg active:scale-[0.98] relative overflow-hidden group"
            disabled={isLoading}
          >
            {/* Subtle button hover glow */}
            <div className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-out" />
            
            <span className="relative flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign up"
              )}
            </span>
          </Button>
        </motion.div>
        
        <motion.div variants={itemVariants} className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 transition-colors hover:underline underline-offset-4">
            Sign in
          </Link>
        </motion.div>
      </form>
    </motion.div>
  );
}
