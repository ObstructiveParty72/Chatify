import { useState } from "react";
import { X, Camera, Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function CreateGroupModal({ isOpen, onClose }) {
  const { allContacts, createGroup } = useChatStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImage(reader.result);
    };
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || selectedMembers.length === 0) return;

    setIsSubmitting(true);
    const res = await createGroup({
      name,
      description,
      members: selectedMembers,
      image,
    });
    setIsSubmitting(false);

    if (res) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Users className="text-cyan-500" size={24} />
            Create New Group
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Group Image */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="size-24 rounded-2xl bg-slate-700 overflow-hidden border-2 border-slate-600 flex items-center justify-center">
                {image ? (
                  <img src={image} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="text-slate-500" size={32} />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-2xl">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                <Camera className="text-white" size={24} />
              </label>
            </div>
            <p className="text-xs text-slate-400">Add a group icon</p>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Group Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Project Team"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Select Members ({selectedMembers.length})</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {allContacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => toggleMember(contact._id)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${
                    selectedMembers.includes(contact._id)
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-slate-900/50 border-transparent hover:border-slate-600"
                  }`}
                >
                  <img src={contact.profilePic || "/avatar.png"} className="size-8 rounded-full" />
                  <span className="text-sm text-slate-200">{contact.fullName}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name || selectedMembers.length === 0}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-cyan-600/20"
          >
            {isSubmitting ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;
