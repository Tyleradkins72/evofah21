
// admin.js - Admin panel functionality with better debugging

class AdminPanel {
    constructor() {
        console.log('🔧 AdminPanel constructor called');
        this.relay = null;
        this.userProfile = this.getUserProfile();
        console.log('👤 User profile loaded:', this.userProfile);
        this.checkAccess();
        this.setupEventListeners();
        
        // Initialize relay AFTER a short delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeRelay();
        }, 100);
    }

    getUserProfile() {
        try {
            const stored = localStorage.getItem('userProfile');
            if (stored) {
                const profile = JSON.parse(stored);
                console.log('✅ Profile loaded from localStorage:', profile);
                return profile;
            }
        } catch(e) {
            console.error('❌ Error loading profile:', e);
        }
        console.warn('⚠️ No profile found, using guest');
        return { status: 'player', username: 'guest' };
    }

    checkAccess() {
        const staffRanks = ['owner', 'sr.admin', 'admin', 'moderator'];
        
        console.log('🔐 Checking access for:', this.userProfile.status);
        
        if (!staffRanks.includes(this.userProfile.status)) {
            console.log('🚫 Access denied - not staff');
            document.getElementById('accessDenied').style.display = 'block';
            document.getElementById('panelTitle').textContent = '🚫 ACCESS DENIED';
            return;
        }

        console.log('✅ Access granted');

        // Set panel title
        const titles = {
            owner: '👑 OWNER PANEL',
            'sr.admin': '⚡ SR. ADMIN PANEL',
            admin: '🛡️ ADMIN PANEL',
            moderator: '🔰 MODERATOR PANEL'
        };
        document.getElementById('panelTitle').textContent = titles[this.userProfile.status];
        
        // Show appropriate sections
        if (this.userProfile.status === 'owner') {
            document.getElementById('ownerSection').style.display = 'block';
            document.getElementById('srAdminSection').style.display = 'block';
            document.getElementById('adminSection').style.display = 'block';
            document.getElementById('moderatorSection').style.display = 'block';
        } else if (this.userProfile.status === 'sr.admin') {
            document.getElementById('srAdminSection').style.display = 'block';
            document.getElementById('adminSection').style.display = 'block';
            document.getElementById('moderatorSection').style.display = 'block';
        } else if (this.userProfile.status === 'admin') {
            document.getElementById('adminSection').style.display = 'block';
            document.getElementById('moderatorSection').style.display = 'block';
        } else if (this.userProfile.status === 'moderator') {
            document.getElementById('moderatorSection').style.display = 'block';
        }
    }

    async initializeRelay() {
        console.log('🌐 Initializing relay connection...');
        
        try {
            const RELAY_SERVER = 'wss://relayfah.onrender.com';
            console.log('🔌 Connecting to:', RELAY_SERVER);
            
            if (typeof RelayClient === 'undefined') {
                console.error('❌ RelayClient not found! Make sure relay-client.js is loaded first.');
                alert('Error: RelayClient not loaded. Check console.');
                this.updateConnectionStatus(false);
                return;
            }
            
            this.relay = new RelayClient(RELAY_SERVER);
            await this.relay.connect();
            
            console.log('✅ Relay connected');
            this.updateConnectionStatus(true);
            
            // Join admin channel
            console.log('📡 Joining admin_actions room...');
            this.relay.joinRoom('admin_actions', this.userProfile.username, this.userProfile.status);
            
            // Listen for admin action confirmations
            this.relay.on('admin_action_result', (data) => {
                console.log('📨 Admin action result:', data);
                if (data.success) {
                    alert(`✅ ${data.message}`);
                } else {
                    alert(`❌ ${data.message}`);
                }
            });

            // Listen for connection events
            this.relay.on('connected', () => {
                console.log('✅ Relay connected event');
                this.updateConnectionStatus(true);
            });

            this.relay.on('disconnected', () => {
                console.log('❌ Relay disconnected event');
                this.updateConnectionStatus(false);
            });

            

            console.log('✅ Admin panel fully initialized');
        } catch (error) {
            console.error('❌ Failed to connect admin panel:', error);
            this.updateConnectionStatus(false);
            alert('Failed to connect to server. Admin actions will not work.\n\nError: ' + error.message);
        }
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connectionStatus');
        if (connected) {
            statusEl.textContent = '✅ Connected';
            statusEl.className = 'connection-status connected';
            console.log('🟢 Status: Connected');
        } else {
            statusEl.textContent = '❌ Disconnected';
            statusEl.className = 'connection-status disconnected';
            console.log('🔴 Status: Disconnected');
        }
    }

    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // OWNER: Promote/Demote
        const promoteBtn = document.getElementById('promoteBtn');
        if (promoteBtn) {
            promoteBtn.addEventListener('click', () => this.handlePromote());
            console.log('✅ Promote button listener added');
        }

        // OWNER: Permanent Ban
        const permBanBtn = document.getElementById('permBanBtn');
        if (permBanBtn) {
            permBanBtn.addEventListener('click', () => this.handlePermBan());
            console.log('✅ Perm ban button listener added');
        }

        // SR. ADMIN: Ban
        const srBanBtn = document.getElementById('srBanBtn');
        if (srBanBtn) {
            srBanBtn.addEventListener('click', () => this.handleSrBan());
            console.log('✅ Sr ban button listener added');
        }

        // ADMIN: Ban
        const adminBanBtn = document.getElementById('adminBanBtn');
        if (adminBanBtn) {
            adminBanBtn.addEventListener('click', () => this.handleAdminBan());
            console.log('✅ Admin ban button listener added');
        }

        // MODERATOR: Mute
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => this.handleMute());
            console.log('✅ Mute button listener added');
        }
        const unmuteBtn = document.getElementById('unmuteBtn');
if (unmuteBtn) {
    unmuteBtn.addEventListener('click', () => this.handleUnmute());
    console.log('✅ Unmute button listener added');
}

//unban
        const unbanBtn = document.getElementById('unbanBtn');
if (unbanBtn) {
    unbanBtn.addEventListener('click', () => this.handleUnban());
    console.log('✅ Unban button listener added');
}
        
        console.log('✅ All event listeners set up');
    }

    handlePromote() {
        console.log('👑 Promote button clicked');
        const username = document.getElementById('promoteUsername').value.trim();
        const rank = document.getElementById('promoteRank').value;

        if (!username) {
            alert('Enter a username');
            return;
        }

        if (!this.relay || !this.relay.connected) {
            alert('Not connected to server!');
            console.error('❌ Relay not connected');
            return;
        }

        if (!confirm(`Set ${username}'s rank to ${rank}?`)) {
            return;
        }

        console.log('📤 Sending promote action:', { username, rank });

        // Send to relay server
        this.relay.send({
            type: 'admin_action',
            action: 'promote',
            targetUsername: username,
            newRank: rank,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status
        });

        document.getElementById('promoteUsername').value = '';
    }

    handlePermBan() {
        console.log('🚫 Perm ban button clicked');
        const username = document.getElementById('permBanUsername').value.trim();
        const days = parseInt(document.getElementById('permBanDays').value) || 0;

        if (!username) {
            alert('Enter a username');
            return;
        }

        if (!this.relay || !this.relay.connected) {
            alert('Not connected to server!');
            console.error('❌ Relay not connected');
            return;
        }

        const banType = days === 0 ? 'PERMANENT' : `${days} days`;
        if (!confirm(`Ban ${username} for ${banType}?`)) {
            return;
        }

        console.log('📤 Sending perm ban:', { username, days });

        this.relay.send({
            type: 'admin_action',
            action: 'ban',
            targetUsername: username,
            days: days,
            permanent: days === 0,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status,
            reason: 'Owner ban'
        });

        document.getElementById('permBanUsername').value = '';
        document.getElementById('permBanDays').value = '';
    }

    handleSrBan() {
        console.log('⚡ Sr ban button clicked');
        const username = document.getElementById('srBanUsername').value.trim();
        const days = Math.min(parseInt(document.getElementById('srBanDays').value) || 1, 30);

        if (!username) {
            alert('Enter a username');
            return;
        }

        if (!this.relay || !this.relay.connected) {
            alert('Not connected to server!');
            console.error('❌ Relay not connected');
            return;
        }

        if (!confirm(`Ban ${username} for ${days} days?`)) {
            return;
        }

        console.log('📤 Sending sr ban:', { username, days });

        this.relay.send({
            type: 'admin_action',
            action: 'ban',
            targetUsername: username,
            days: days,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status,
            reason: 'Sr. Admin ban',
            maxDays: 30
        });

        document.getElementById('srBanUsername').value = '';
        document.getElementById('srBanDays').value = '';
    }

    handleAdminBan() {
        console.log('🛡️ Admin ban button clicked');
        const username = document.getElementById('adminBanUsername').value.trim();
        const days = Math.min(parseInt(document.getElementById('adminBanDays').value) || 1, 7);

        if (!username) {
            alert('Enter a username');
            return;
        }

        if (!this.relay || !this.relay.connected) {
            alert('Not connected to server!');
            console.error('❌ Relay not connected');
            return;
        }

        if (!confirm(`Ban ${username} for ${days} days?`)) {
            return;
        }

        console.log('📤 Sending admin ban:', { username, days });

        this.relay.send({
            type: 'admin_action',
            action: 'ban',
            targetUsername: username,
            days: days,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status,
            reason: 'Admin ban',
            maxDays: 7
        });

        document.getElementById('adminBanUsername').value = '';
        document.getElementById('adminBanDays').value = '';
    }

    handleMute() {
        console.log('🔇 Mute button clicked');
        const username = document.getElementById('muteUsername').value.trim();
        const hours = Math.min(parseInt(document.getElementById('muteHours').value) || 1, 24);

        if (!username) {
            alert('Enter a username');
            return;
        }

        if (!this.relay || !this.relay.connected) {
            alert('Not connected to server!');
            console.error('❌ Relay not connected');
            return;
        }

        if (!confirm(`Mute ${username} for ${hours} hours?`)) {
            return;
        }

        console.log('📤 Sending mute:', { username, hours });

        this.relay.send({
            type: 'admin_action',
            action: 'mute',
            targetUsername: username,
            hours: hours,
            adminUsername: this.userProfile.username,
            adminRank: this.userProfile.status
        });

        document.getElementById('muteUsername').value = '';
        document.getElementById('muteHours').value = '';
    }
    handleUnmute() {
    console.log('🔊 Unmute button clicked');
    const username = document.getElementById('unmuteUsername').value.trim();

    if (!username) {
        alert('Enter a username');
        return;
    }

    if (!this.relay || !this.relay.connected) {
        alert('Not connected to server!');
        console.error('❌ Relay not connected');
        return;
    }

    if (!confirm(`Remove mute from ${username}?`)) {
        return;
    }

    console.log('📤 Sending unmute:', { username });

    this.relay.send({
        type: 'admin_action',
        action: 'unmute',
        targetUsername: username,
        adminUsername: this.userProfile.username,
        adminRank: this.userProfile.status
    });

    document.getElementById('unmuteUsername').value = '';
}
handleUnban() {
    console.log('🔓 Unban button clicked');
    const username = document.getElementById('unbanUsername').value.trim();

    if (!username) {
        alert('Enter a username');
        return;
    }

    if (!this.relay || !this.relay.connected) {
        alert('Not connected to server!');
        console.error('❌ Relay not connected');
        return;
    }

    if (!confirm(`Remove ban from ${username}?`)) {
        return;
    }

    console.log('📤 Sending unban request:', { username });

    this.relay.send({
        type: 'admin_action',
        action: 'unban',
        targetUsername: username,
        adminUsername: this.userProfile.username,
        adminRank: this.userProfile.status
    });

    document.getElementById('unbanUsername').value = '';
}
  
}

// Initialize admin panel when page loads
let adminPanel = null;

console.log('🚀 admin.js loaded');

// Try multiple initialization methods
if (document.readyState === 'loading') {
    console.log('⏳ DOM still loading, waiting...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded fired');
        adminPanel = new AdminPanel();
    });
} else {
    console.log('✅ DOM already loaded');
    adminPanel = new AdminPanel();
}

// Backup initialization after a delay
setTimeout(() => {
    if (!adminPanel) {
        console.log('⚠️ Backup initialization triggered');
        adminPanel = new AdminPanel();
    }
}, 500);
