import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import CreateGroupModal from "./CreateGroupModal";
import { Users } from "lucide-react";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, searchContactByEmail } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [searchEmail, setSearchEmail] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail) return;
    const res = await searchContactByEmail(searchEmail);
    if (res) {
      if (res.isInvited) {
        toast.success(res.message);
      } else {
        setSelectedUser(res);
      }
      setSearchEmail("");
    }
  };

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="email"
              placeholder="Add by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-3 pr-10 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500 transition-colors"
            >
              <Search size={18} />
            </button>
          </div>
        </form>
        <button
          onClick={() => setIsGroupModalOpen(true)}
          className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 p-2 rounded-lg transition-colors border border-cyan-500/20"
          title="Create Group"
        >
          <Users size={20} />
        </button>
      </div>

      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />

      <div className="flex-1 space-y-2">
        {allContacts.map((contact) => (
          <div
            key={contact._id}
            className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
            onClick={() => setSelectedUser(contact)}
          >
            <div className="flex items-center gap-3">
              <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                <div className="size-12 rounded-full">
                  <img src={contact.profilePic || "/avatar.png"} />
                </div>
              </div>
              <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default ContactList;
