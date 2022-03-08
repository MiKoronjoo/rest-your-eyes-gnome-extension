const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

let myPopup;
const ON = '🟢 ON';
const OFF = '🔴 OFF';
const script_path = Me.dir.get_path() + '/mali_xcowsay';
const icon_open = Me.dir.get_path() + '/icon-open.png';
const icon_close = Me.dir.get_path() + '/icon-close.png';
const periods = [10, 15, 20, 30];
const DEFAULT = 20;
let TIME = DEFAULT;
let ACTIVE = null;


const MyPopup = GObject.registerClass(
    class MyPopup extends PanelMenu.Button {

        _init() {
            super._init(0);
            this._icon = new St.Icon({
                style_class: 'system-status-icon',
            });
            this._icon.gicon = Gio.icon_new_for_string(icon_close);

            this.add_actor(this._icon);
            log(this.get_child_at_index(0));
            log(this.get_child_at_index(1));
            this.activeItem = new PopupMenu.PopupSwitchMenuItem(OFF, ACTIVE, { reactive: true });
            Util.spawn(['chmod', '+x', script_path]);
            this.activeItem.connect('toggled', () => {
                log(this.get_child_at_index(0));
                ACTIVE = this.activeItem.state;
                if (ACTIVE) {
                    this.activeItem.get_child_at_index(1).set_text(ON);
                    this._icon.gicon = Gio.icon_new_for_string(icon_open);
                    Util.spawn([script_path, '' + TIME, '1']);
                } else {
                    this.activeItem.get_child_at_index(1).set_text(OFF);
                    this._icon.gicon = Gio.icon_new_for_string(icon_close);
                    Util.spawn(['killall', 'mali_xcowsay']);
                }
            });
            this.menu.addMenuItem(this.activeItem);

            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            let subItem = new PopupMenu.PopupSubMenuMenuItem('Time Period');
            this.menu.addMenuItem(subItem);
            this.time = {}
            periods.forEach(time => {
                this.time[time] = new PopupMenu.PopupMenuItem(time + ' min');
                this.time[time].connect('activate', () => {
                    periods.forEach(t => {
                        if (t !== time)
                            this.time[t].get_child_at_index(0).set_text('');
                    });
                    this.time[time].get_child_at_index(0).set_text('•');
                    TIME = time;
                    if (ACTIVE) {
                        Util.spawn(['killall', 'mali_xcowsay']);
                        Util.spawn([script_path, '' + TIME, '0']);
                    }
                });
                subItem.menu.addMenuItem(this.time[time]);
            });
            this.time[TIME].get_child_at_index(0).set_text('•');
        }
    });

function init() {
}

function enable() {
    ACTIVE = false;
    myPopup = new MyPopup();
    Main.panel.addToStatusArea('myPopup', myPopup, 1);
}

function disable() {
    if (myPopup) {
        myPopup.destroy();
        myPopup = null;
        ACTIVE = null;
    }
}
