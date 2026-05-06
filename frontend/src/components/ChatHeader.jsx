import { XIcon, Settings } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import CreateGroupModal from "./CreateGroupModal";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isOnline = !selectedUser.isGroup && onlineUsers.includes(selectedUser._id);
  const isAdmin = selectedUser.isGroup && selectedUser.adminId === authUser?._id;

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div
      className="flex justify-between items-center bg-slate-800/50 border-b
   border-slate-700/50 max-h-[84px] px-6 flex-1"
    >
      <div className="flex items-center space-x-3 py-4">
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-12 rounded-full">
            <img 
              src={selectedUser.isGroup ? (selectedUser.image || "/group.png") : (selectedUser.profilePic || "/avatar.png")} 
              alt={selectedUser.isGroup ? selectedUser.name : selectedUser.fullName} 
            />
          </div>
        </div>

        <div>
          <h3 className="text-slate-200 font-medium">{selectedUser.isGroup ? selectedUser.name : selectedUser.fullName}</h3>
          <p className="text-slate-400 text-sm">
            {selectedUser.isGroup ? `${selectedUser.members.length} members` : (isOnline ? "Online" : "Offline")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {selectedUser.isGroup && isAdmin && (
          <button onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
          </button>
        )}
        <button onClick={() => setSelectedUser(null)}>
          <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
        </button>
      </div>

      {isSettingsOpen && (
        <CreateGroupModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          editMode={true}
          groupData={selectedUser}
        />
      )}
    </div>
  );
}
export default ChatHeader;
