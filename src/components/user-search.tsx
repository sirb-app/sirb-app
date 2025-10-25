"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role?: string;
}

interface UserSearchProps {
  onUserSelect: (user: UserSearchResult | null) => void;
  selectedUser: UserSearchResult | null;
  excludeUserIds?: Set<string>;
  searchAction: (query: string) => Promise<UserSearchResult[]>;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
}

export function UserSearch({
  onUserSelect,
  selectedUser,
  excludeUserIds = new Set(),
  searchAction,
  disabled = false,
  placeholder = "ابحث بالاسم أو البريد الإلكتروني...",
  label = "البحث عن مستخدم",
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        searchAction(searchQuery)
          .then(results => {
            if (!cancelled) {
              setSearchResults(
                results.filter(user => !excludeUserIds.has(user.id))
              );
            }
          })
          .catch(() => {
            if (!cancelled) {
              setSearchResults([]);
            }
          })
          .finally(() => {
            if (!cancelled) {
              setIsSearching(false);
            }
          });
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery, excludeUserIds, searchAction]);

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .filter(n => n.trim().length > 0)
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user-search">{label}</Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="user-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
        </div>
      </div>

      {selectedUser && (
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.image ?? undefined} />
                <AvatarFallback>
                  {getUserInitials(selectedUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{selectedUser.name}</p>
                <p className="text-muted-foreground truncate text-sm">
                  {selectedUser.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUserSelect(null)}
              disabled={disabled}
              className="h-8 w-8"
              aria-label="إزالة المستخدم المحدد"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!selectedUser && searchQuery.trim().length >= 2 && (
        <div className="space-y-2">
          {isSearching ? (
            <p className="text-muted-foreground text-center text-sm">
              جارٍ البحث...
            </p>
          ) : searchResults.length === 0 ? (
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                لم يتم العثور على مستخدمين
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                تأكد من وجود مستخدمين في النظام أو جرب بحث آخر
              </p>
            </div>
          ) : (
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onUserSelect(user)}
                  disabled={disabled}
                  className={cn(
                    "hover:bg-muted flex w-full items-center gap-3 rounded-lg p-3 text-right transition-colors",
                    "disabled:pointer-events-none disabled:opacity-50"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback>
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      {user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
