 self.new_tab_btn = QAction("➕", self) # Emoji
        self.new_tab_btn.triggered.connect(lambda: self.add_tab())
        self.navtb.addAction(self.new_tab_btn)

        self.inspect_btn = QAction("🛠️", self) # Retaining an emoji here as it's general
        self.inspect_btn.triggered.connect(self.toggle_inspector)
        self.navtb.addAction(self.inspect_btn)

        self.theme_toggle_btn = QAction("🎨", self) # Retaining an emoji here
        self.theme_toggle_btn.triggered.connect(self.toggle_theme)
        self.navtb.addAction(self.theme_toggle_btn)

        self.about_btn = QAction("ℹ️", self) # Retaining an emoji here
        self.about_btn.triggered.connect(self.show_about)
        self.navtb.addAction(self.about_btn)

        # --- Menu Bar Setup ---
        main_menu = self.menuBar()

        # File Menu
        file_menu = main_menu.addMenu(self._T("file_menu")) # &File
        
        new_window_action = QAction(self._T("new_window_action"), self) # New &Window
        new_window_action.setShortcut(QKeySequence("Ctrl+N"))
        new_window_action.triggered.connect(self.open_new_browser_window)
        file_menu.addAction(new_window_action)

        file_menu.addSeparator()

        close_tab_action = QAction(self._T("close_tab_action"), self) # Close Current &Tab
        close_tab_action.setShortcut(QKeySequence("Ctrl+D")) # As per user request, typically Ctrl+W
        close_tab_action.triggered.connect(self.close_current_tab)
        file_menu.addAction(close_tab_action)

        # Bookmarks Menu
        self.bookmarks_menu = main_menu.addMenu(self._T("bookmarks_menu")) # &Bookmarks

        self.add_bookmark_action = QAction(self._T("add_bookmark_action"), self)
        self.add_bookmark_action.setShortcut(QKeySequence("Ctrl+B"))
        self.add_bookmark_action.triggered.connect(self.add_bookmark)
        self.bookmarks_menu.addAction(self.add_bookmark_action)

        self.show_bookmarks_action = QAction(self._T("show_bookmarks_action"), self)
        self.show_bookmarks_action.triggered.connect(self.show_all_bookmarks)
        self.bookmarks_menu.addAction(self.show_bookmarks_action)
        self.bookmarks_menu.addSeparator() # For dynamic bookmarks to be added below

        # Language Menu
        language_menu = main_menu.addMenu("Language") # No translation for "Language" menu itself

        self.lang_group = QActionGroup(self)
        self.lang_group.setExclusive(True)

        languages = {
            "English": "en",
            "Deutsch": "de",
            "Español": "es",
            "普通话 (Mandarin)": "zh",
            "Frysk": "fy",
            "Français": "fr",
            "Ga (Ghana)": "gaa"
        }

        for lang_name, lang_code in languages.items():
            action = QAction(lang_name, self)
            action.setCheckable(True)
            action.triggered.connect(lambda checked, code=lang_code: self._set_language(code))
            language_menu.addAction(action)
            self.lang_group.addAction(action)
            if lang_code == self.current_language:
                action.setChecked(True)
        # --- End Language Menu ---

        # --- Steno Search Menu (Placeholder actions due to 'leave out stenosearch') ---
        steno_search_menu = main_menu.addMenu(self._T("steno_search_menu"))
        self.build_index_action = QAction(self._T("build_index_action"), self)
        # This action will still exist in the menu, but its function is a no-op
        self.build_index_action.triggered.connect(self.build_steno_index)
        steno_search_menu.addAction(self.build_index_action)
        # --- End Steno Search Menu ---
        # --- End Menu Bar Setup ---

        self.tab_suspend_timers = {}
        self.history = []
        self.bookmarks = [] # Initialize bookmarks list
        self._load_bookmarks() # Load bookmarks at startup

        # Initialize Steno Search Core (even if its methods are disabled)
        self.steno_search_core = StenoSearchCore()
        # The following load_index call will now print "StenoSearch: Index loading functionality is currently disabled."
        self.steno_search_core.load_index(status_callback=self.status.showMessage)

        # Add the first tab with the new, more flexible `add_tab` method
        if initial_url:
            self.add_tab(initial_url)
        else:
            self.add_tab()

        self.is_dark_theme = False
        self.is_fiery_theme = False
        self.apply_theme()

        self.performance_timer = QTimer(self)
        self.performance_timer.setInterval(5000)
        self.performance_timer.timeout.connect(self.update_performance_stats)
        self.performance_timer.start()

        self._apply_translations() # Apply translations for newly added menu items

        self.show() # Make sure the main window is shown

    def _set_language(self, lang_code):
        if self.current_language == lang_code:
            return

        self.current_language = lang_code
        print(f"Switching language to: {lang_code}")
        self._apply_translations()

    def _get_translated_string(self, key):
        return self._lang_strings.get(self.current_language, self._lang_strings["en"]).get(key, key)

    _T = _get_translated_string

    def _apply_translations(self):
        self.navtb.setWindowTitle(self._T("nav_toolbar_title"))
        self.back_btn.setToolTip(self._T("back_tooltip"))
        self.forward_btn.setToolTip(self._T("forward_tooltip"))
        self.reload_btn.setToolTip(self._T("reload_tooltip"))
        self.home_btn.setToolTip(self._T("home_tooltip"))
        self.urlbar.setPlaceholderText(self._T("urlbar_placeholder"))
        self.stop_btn.setToolTip(self._T("stop_tooltip"))
        self.new_tab_btn.setToolTip(self._T("new_tab_tooltip"))
        self.inspect_btn.setToolTip(self._T("inspect_tooltip"))
        self.theme_toggle_btn.setToolTip(self._T("theme_tooltip"))
        self.about_btn.setToolTip(self._T("about_tooltip"))

        # Update menu titles and actions
        main_menu = self.menuBar()
        for action in main_menu.actions():
            if action.menu():
                menu = action.menu()
                # Use a specific key to identify the menu for translation
                if menu.title().endswith(self._lang_strings["en"]["file_menu"].replace("&", "")): # Check for "File" (English fallback)
                    menu.setTitle(self._T("file_menu"))
                    for sub_action in menu.actions():
                        if sub_action.shortcut().matches(QKeySequence("Ctrl+N")) == QKeySequence.ExactMatch:
                             sub_action.setText(self._T("new_window_action"))
                        elif sub_action.shortcut().matches(QKeySequence("Ctrl+D")) == QKeySequence.ExactMatch:
                             sub_action.setText(self._T("close_tab_action"))
                elif menu.title().endswith(self._lang_strings["en"]["bookmarks_menu"].replace("&", "")): # Check for "Bookmarks" (English fallback)
                    menu.setTitle(self._T("bookmarks_menu"))
                    for sub_action in menu.actions():
                        if sub_action.shortcut().matches(QKeySequence("Ctrl+B")) == QKeySequence.ExactMatch:
                            sub_action.setText(self._T("add_bookmark_action"))
                        elif sub_action == self.show_bookmarks_action: # Check identity for "Show All Bookmarks"
                            sub_action.setText(self._T("show_bookmarks_action"))
                elif menu.title().endswith(self._lang_strings["en"]["steno_search_menu"]): # Check for "Steno Search" (English fallback)
                    menu.setTitle(self._T("steno_search_menu"))
                    for sub_action in menu.actions():
                        if sub_action == self.build_index_action:
                            sub_action.setText(self._T("build_index_action"))
                # "Language" menu itself remains untranslated

        self.update_performance_stats()
        current_browser = self.current_browser()
        if current_browser:
            self.update_title(current_browser)
        else:
            self.setWindowTitle(f"Ringzauber Browser")
        self._populate_bookmarks_menu() # Re-populate bookmarks menu with translated titles

    def connect_browser_signals(self, browser):
        """Helper function to connect all necessary signals for a browser view."""
        print(f"DEBUG: Attempting to connect signals for browser: {browser}")
        try:
            # Using lambdas with captured variables is a common and safe pattern in Python closures.
            # We add a check for 'browser' being a valid QObject to prevent crashes.
            browser.urlChanged.connect(lambda new_url, b=browser: self.update_urlbar_for_browser(b, new_url) if b else None)
            print("DEBUG: Signal 'urlChanged' connected.")
            browser.loadFinished.connect(lambda ok, b=browser: self.on_load_finished(ok, b) if b else None)
            print("DEBUG: Signal 'loadFinished' connected.")
            browser.page().titleChanged.connect(lambda title, b=browser: self.update_title_on_change(b, title) if b else None)
            print("DEBUG: Signal 'titleChanged' connected.")
            browser.page().iconChanged.connect(lambda icon, b=browser: self.update_tab_icon(b, icon) if b else None)
            print("DEBUG: Signal 'iconChanged' connected.")
            browser.page().featurePermissionRequested.connect(self.handle_feature_permission_requested)
            print("DEBUG: Signal 'featurePermissionRequested' connected.")
            print("DEBUG: All signals connected successfully.")
        except Exception as e:
            print(f"DEBUG: CRITICAL - Could not connect signals for browser {browser}: {e}")
            import traceback
            traceback.print_exc()

    def add_tab(self, url=None, label=None):
        """
        Adds a new tab to the browser.
        :param url: The URL to load. Defaults to the homepage.
        :param label: The initial label for the tab.
        """
        print("DEBUG: add_tab called.")
        browser = CustomWebEngineView() # Use our custom WebView
        browser.setZoomFactor(1.35)

        # --- Set the custom page on the view, so we can override createWindow ---
        custom_page = CustomWebEnginePage(self, browser) # Pass 'self' (MainWindow) to the page
        browser.setPage(custom_page)
        # --- END BUG FIX ---
        
        # Connect signals for this browser
        self.connect_browser_signals(browser)

        if url is None:
            # If no URL is provided, load the default homepage.
            url = QUrl("http://stenoip.github.io")
            browser.setUrl(url)
        elif not isinstance(url, QUrl):
             # Ensure it's a QUrl object
             url = QUrl(url)
             browser.setUrl(url)
        else:
             # Load the provided URL
             browser.setUrl(url)

        if label is None:
            label = self._T("new_tab_tooltip")

        i = self.tabs.addTab(browser, label)
        self.tabs.setCurrentIndex(i)
        print("DEBUG: Tab added and set as current.")
        return browser

    def open_new_browser_window(self):
        """Opens a new top-level browser window."""
        print("DEBUG: Opening new browser window (Ctrl+N).")
        # Instantiate a new MainWindow without an initial URL, it will open default homepage
        new_window = MainWindow()
        new_window.show()

    def open_new_browser_window_with_url(self, url):
        """Opens a new top-level browser window and loads a specific URL."""
        print(f"DEBUG: Opening new browser window with URL: {url.toString()}")
        new_window = MainWindow(initial_url=url) # Pass the URL to the new window
        new_window.show()

    def close_current_tab(self):
        """Closes the currently active tab."""
        current_index = self.tabs.currentIndex()
        if current_index != -1:
            print(f"DEBUG: Closing current tab at index {current_index} (Ctrl+D).")
            self.tabs.tabCloseRequested.emit(current_index)

    def start_suspend_timer(self, browser):
        if not browser: return
        timer = self.tab_suspend_timers.get(browser)
        if timer:
            timer.stop()
        timer = QTimer(self)
        timer.setSingleShot(True)
        timer.setInterval(SUSPEND_TIMEOUT_MS)
        timer.timeout.connect(lambda b=browser: self.suspend_tab(b))
        timer.start()
        self.tab_suspend_timers[browser] = timer

    def suspend_tab(self, browser):
        if browser == self.current_browser() or not browser:
            return
        if isinstance(browser, CustomWebEngineView) and not browser.is_suspended:
            browser.suspend()

    def resume_tab(self, browser):
        if browser and isinstance(browser, CustomWebEngineView) and browser.is_suspended:
            browser.resume()

    def on_tab_changed(self, index):
        print(f"DEBUG: on_tab_changed called. Index: {index}")
        if index == -1:
            self.update_urlbar_for_browser(None, QUrl(""))
            self.setWindowTitle("Ringzauber Browser")
            return

        current_browser = self.tabs.widget(index)
        if not current_browser: return

        self.resume_tab(current_browser)

        for i in range(self.tabs.count()):
            browser_widget = self.tabs.widget(i)
            if browser_widget:
                timer = self.tab_suspend_timers.get(browser_widget)
                if browser_widget == current_browser:
                    if timer:
                        timer.stop()
                else:
                    self.start_suspend_timer(browser_widget)

        self.update_urlbar_for_browser(current_browser, current_browser.url())
        self.update_title(current_browser)

    def close_tab(self, index):
        browser = self.tabs.widget(index)
        if not browser:
            return

        timer = self.tab_suspend_timers.pop(browser, None)
        if timer:
            timer.stop()

        try:
            # Disconnect all signals to avoid crashes
            print("DEBUG: Disconnecting signals for closing tab.")
            browser.urlChanged.disconnect()
            browser.loadFinished.disconnect()
            browser.page().titleChanged.disconnect()
            browser.page().iconChanged.disconnect()
            browser.page().featurePermissionRequested.disconnect()
        except TypeError:
            print("DEBUG: Some signals were already disconnected.")
            pass # Already disconnected, or no connections existed

        if hasattr(browser, 'dev_tools_view') and browser.dev_tools_view:
            browser.dev_tools_view.close()
        # QWebEngineView.page().setDevToolsPage(None) must be called on the main page,
        # not the dev tools view itself. This correctly detaches the dev tools.
        if browser.page():
            print("DEBUG: Detaching dev tools and scheduling page for deletion.")
            browser.page().setDevToolsPage(None)
            browser.page().deleteLater() # Schedule for deletion
        
        print("DEBUG: Detaching page from view and scheduling view for deletion.")
        browser.setPage(None) # Detach page from view
        browser.deleteLater() # Schedule view for deletion

        self.tabs.removeTab(index)
        print("DEBUG: Tab removed from tab widget.")

        if self.tabs.count() == 0:
            print("DEBUG: Last tab closed, adding a new one.")
            self.add_tab() # Ensure at least one tab is always open

    def current_browser(self):
        return self.tabs.currentWidget()

    def update_title(self, browser):
        if not browser: return
        idx = self.tabs.indexOf(browser)
        if idx == -1:
            return

        title = browser.page().title()
        if not title or browser.is_suspended: # Add check for suspension
            if browser.is_suspended:
                title = "Suspended Tab"
            else:
                title = "Loading..."

        tab_title = title[:30] + '...' if len(title) > 30 else title
        self.tabs.setTabText(idx, tab_title)

        icon = browser.page().icon()
        if not icon.isNull():
            self.tabs.setTabIcon(idx, icon)

        if self.tabs.currentIndex() == idx:
            self.setWindowTitle(f"{title} - Ringzauber Browser")

    def update_title_on_change(self, browser, title):
        if not browser: return
        idx = self.tabs.indexOf(browser)
        if idx != -1:
            tab_title = title[:30] + '...' if len(title) > 30 else title
            self.tabs.setTabText(idx, tab_title)
            if self.tabs.currentIndex() == idx:
                self.setWindowTitle(f"{title} - Ringzauber Browser")

    def update_tab_icon(self, browser, icon):
        if not browser: return
        idx = self.tabs.indexOf(browser)
        if idx != -1:
            self.tabs.setTabIcon(idx, icon)

    def navigate_to_url(self):
        browser = self.current_browser()
        if not browser: return

        text = self.urlbar.text().strip()
        if not text: return

        qurl = QUrl(text)
        if not qurl.scheme():
            # If no scheme, try prepending https:// first, then http://
            test_url_https = QUrl("https://" + text)
            test_url_http = QUrl("http://" + text)

            if test_url_https.isValid():
                browser.setUrl(test_url_https)
            elif test_url_http.isValid():
                browser.setUrl(test_url_http)
            else:
                # If neither https nor http makes it valid, it's likely a malformed URL or a search query.
                # Since StenoSearch is out, we treat it as an invalid URL.
                self.show_error_page(
                    "Invalid Address",
                    "The address you entered is not a valid URL format. Please check for typos."
                )
                return # Stop here if URL is invalid

        elif not qurl.isValid():
            # Scheme exists but URL is otherwise invalid (e.g., "http://_bad_url")
            self.show_error_page(
                "Invalid Address",
                "The address you entered is malformed. Please check for typos."
            )
            return # Stop here if URL is invalid
        else:
            browser.setUrl(qurl)

        if text and text not in self.history:
            self.history.append(text)

    def update_urlbar_for_browser(self, browser, q):
        if browser and self.current_browser() == browser:
            self.urlbar.setText(q.toString())
            self.urlbar.setCursorPosition(0)
        elif not browser and not self.current_browser():
            self.urlbar.setText("")

    def toggle_theme(self):
        if not self.is_dark_theme and not self.is_fiery_theme:
            self.is_dark_theme = True
            self.is_fiery_theme = False
        elif self.is_dark_theme:
            self.is_dark_theme = False
            self.is_fiery_theme = True
        else:
            self.is_dark_theme = False
            self.is_fiery_theme = False
        self.apply_theme()

    def apply_theme(self):
        if self.is_fiery_theme:
            self.setStyleSheet("""
                QMainWindow { background-color: #4B1F0B; color: #FFFAF0; }
                QToolBar { background-color: #B03010; border: none; }
                QToolBar QToolButton { color: #FFFAF0; }
                QTabWidget::pane { border-top: 2px solid #FF4500; background: #7B2E0E; }
                QTabBar::tab { background: #B03010; color: #FFF0E0; padding: 8px 16px; border-top-left-radius: 10px; border-top-right-radius: 10px; margin-right: 4px; font-weight: bold; font-size: 14px;}
                QTabBar::tab:selected { background: #FF4500; color: black; }
                QTabBar::tab:hover { background: #FF6347; }
                QLineEdit { background: #FFF0E0; color: black; border-radius: 6px; padding: 4px; border: 1px solid #FF4500;}
                QStatusBar { color: #FFFAF0; }
                QMenu { background-color: #B03010; color: #FFFAF0; border: 1px solid #FF4500; }
                QMenu::item:selected { background-color: #FF4500; color: black; }
                QMenuBar { background-color: #B03010; color: #FFFAF0; }
                QMenuBar::item:selected { background-color: #FF4500; color: black; }
            """)
        elif self.is_dark_theme:
            self.setStyleSheet("""
                QMainWindow { background-color: #2c3e50; color: white; }
                QToolBar { background-color: #34495e; border: none; }
                QToolBar QToolButton { color: white; }
                QTabWidget::pane { border-top: 2px solid #1abc9c; background: #34495e; }
                QTabBar::tab { background: #34495e; color: white; padding: 8px 16px; border-top-left-radius: 10px; border-top-right-radius: 10px; margin-right: 4px; font-weight: 600; font-size: 14px;}
                QTabBar::tab:selected { background: #1abc9c; color: black; }
                QTabBar::tab:hover { background: #16a085; }
                QLineEdit { background: #ecf0f1; color: black; border-radius: 6px; padding: 4px; border: 1px solid #1abc9c; }
                QStatusBar { color: white; }
                QMenu { background-color: #34495e; color: white; border: 1px solid #1abc9c; }
                QMenu::item:selected { background-color: #1abc9c; color: black; }
                QMenuBar { background-color: #34495e; color: white; }
                QMenuBar::item:selected { background-color: #1abc9c; color: black; }
            """)
        else: # Default Light Theme
            self.setStyleSheet("""
                QMainWindow { background-color: #f0f0f0; color: black; }
                QToolBar { background-color: #e7e7e7; border: none;}
                QToolBar QToolButton { color: black; }
                QTabWidget::pane { border-top: 2px solid #2980b9; background: #f0f0f0; }
                QTabBar::tab { background: #e7e7e7; color: black; padding: 8px 16px; border-top-left-radius: 10px; border-top-right-radius: 10px; margin-right: 4px; font-weight: 600; font-size: 14px;}
                QTabBar::tab:selected { background: #2980b9; color: white; }
                QTabBar::tab:hover { background: #3498db; }
                QLineEdit { background: white; color: black; border-radius: 6px; padding: 4px; border: 1px solid #2980b9; }
                QStatusBar { color: black; }
                QMenu { background-color: #e7e7e7; color: black; border: 1px solid #2980b9; }
                QMenu::item:selected { background-color: #2980b9; color: white; }
                QMenuBar { background-color: #e7e7e7; color: black; }
                QMenuBar::item:selected { background-color: #2980b9; color: black; }
            """)

    def update_performance_stats(self):
        total_tabs = self.tabs.count()
        active_tab_index = self.tabs.currentIndex()
        active_tab_info = str(active_tab_index + 1) if active_tab_index != -1 else self._T("Active: None")
        status_text = self._T("performance_status").format(total_tabs, active_tab_info)
        self.status.showMessage(status_text)

    def show_about(self):
        QMessageBox.about(self,
                          self._T("about_title"),
                          self._T("about_message"))

    def toggle_inspector(self):
        browser = self.current_browser()
        if not browser: return

        if not hasattr(browser, 'dev_tools_view') or not browser.dev_tools_view:
            browser.dev_tools_view = QWebEngineView()
            dev_tools_page = QWebEnginePage(browser.dev_tools_view)
            browser.dev_tools_view.setPage(dev_tools_page)

            browser.dev_tools_view.resize(800, 600)
            title = browser.page().title() if browser.page() else "Developer Tools"
            browser.dev_tools_view.setWindowTitle(f"Developer Tools - {title[:50]}")

            browser.page().setDevToolsPage(dev_tools_page)
            browser.dev_tools_view.show()
        else:
            if browser.dev_tools_view.isVisible():
                browser.dev_tools_view.hide()
            else:
                browser.dev_tools_view.show()

    # --- Bookmark Management ---
    def _get_bookmarks_file_path(self):
        # Store bookmarks in a user-specific data directory
        data_dir = QStandardPaths.writableLocation(QStandardPaths.AppDataLocation)
        if not data_dir: # Fallback for systems where AppDataLocation is not defined
            data_dir = os.path.join(os.path.expanduser("~"), ".ringzauber_browser")
        
        os.makedirs(data_dir, exist_ok=True) # Ensure directory exists
        return os.path.join(data_dir, BOOKMARKS_FILE)

    def _load_bookmarks(self):
        file_path = self._get_bookmarks_file_path()
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    self.bookmarks = json.load(f)
                print(f"DEBUG: Bookmarks loaded from {file_path}")
            except (IOError, json.JSONDecodeError) as e:
                print(f"ERROR: Could not load bookmarks from {file_path}: {e}")
                self.bookmarks = []
        else:
            self.bookmarks = []
        self._populate_bookmarks_menu()

    def _save_bookmarks(self):
        file_path = self._get_bookmarks_file_path()
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.bookmarks, f, indent=4)
            print(f"DEBUG: Bookmarks saved to {file_path}")
        except IOError as e:
            print(f"ERROR: Could not save bookmarks to {file_path}: {e}")

    def add_bookmark(self):
        browser = self.current_browser()
        if not browser:
            self.status.showMessage(self._T("bookmark_failed_status"))
            return

        url = browser.url().toString()
        if not url or url.startswith("data:text/html"): # Don't bookmark internal pages
            self.status.showMessage(self._T("bookmark_failed_status"))
            return

        title = browser.page().title()
        if not title:
            title = url # Fallback title if page title is not available

        # Check for duplicates
        for bm in self.bookmarks:
            if bm['url'] == url:
                self.status.showMessage(self._T("bookmark_exists_status"))
                return

        # Prompt user to edit title
        new_title, ok = QInputDialog.getText(self, self._T("bookmark_input_title"), self._T("bookmark_input_label"), QLineEdit.Normal, title)
        if ok and new_title:
            self.bookmarks.append({"title": new_title, "url": url})
            self._save_bookmarks()
            self._populate_bookmarks_menu() # Update menu immediately
            self.status.showMessage(self._T("bookmark_added_status").format(new_title))
        else:
            self.status.showMessage(self._T("bookmark_failed_status"))

    def show_all_bookmarks(self):
        print("DEBUG: Showing all bookmarks.")
        
        # Start HTML content
        html_template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ringzauber_bookmarks_page.html")
        try:
            with open(html_template_path, "r", encoding="utf-8") as f:
                html_content = f.read()
        except FileNotFoundError:
            print(f"Warning: {html_template_path} not found. Using fallback HTML for bookmarks page.")
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>{BOOKMARKS_PAGE_TITLE}</title>
                <style>
                    body { font-family: sans-serif; background-color: #f7f7f7; color: #333; margin: 0; padding: 20px; }
                    .container { max-width: 800px; margin: auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 30px; }
                    h1 { color: #2980b9; text-align: center; margin-bottom: 30px; }
                    ul { list-style: none; padding: 0; }
                    li { margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px; }
                    li:last-child { border-bottom: none; }
                    a { color: #0066cc; text-decoration: none; font-size: 1.1em; }
                    a:hover { text-decoration: underline; }
                    .url { font-size: 0.9em; color: #666; word-break: break-all; }
                    .no-bookmarks { text-align: center; color: #777; padding: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>{BOOKMARKS_PAGE_TITLE}</h1>
                    <ul id="bookmark-list">
                        </ul>
                    <div id="no-bookmarks" class="no-bookmarks" style="display: none;">
                        {NO_BOOKMARKS_MESSAGE}
                    </div>
                </div>

                <script>
                    // Placeholder for future JS interaction if needed
                </script>
            </body>
            </html>
            """
            
        bookmark_list_html = ""
        if self.bookmarks:
            for bm in self.bookmarks:
                bookmark_list_html += f'<li><a href="{bm["url"]}">{bm["title"]}</a><br><span class="url">{bm["url"]}</span></li>\n'
            no_bookmarks_display = "none"
        else:
            bookmark_list_html = ""
            no_bookmarks_display = "block"

        html_content = html_content.replace("{BOOKMARKS_PAGE_TITLE}", self._T("bookmarks_page_title"))
        html_content = html_content.replace("{BOOKMARK_LIST_HTML}", bookmark_list_html)
        html_content = html_content.replace("{NO_BOOKMARKS_DISPLAY}", no_bookmarks_display)
        html_content = html_content.replace("{NO_BOOKMARKS_MESSAGE}", self._T("no_bookmarks_message"))

        encoded_html = QByteArray(html_content.encode('utf-8')).toBase64().data().decode('utf-8')
        self.add_tab(QUrl(f"data:text/html;charset=utf-8;base64,{encoded_html}"), self._T("bookmarks_page_title"))

    def _populate_bookmarks_menu(self):
        # Clear existing dynamic bookmark actions
        for action in self.bookmarks_menu.actions():
            if action != self.add_bookmark_action and action != self.show_bookmarks_action and not action.isSeparator():
                self.bookmarks_menu.removeAction(action)
                action.deleteLater() # Ensure action is properly deleted

        # Add bookmarks dynamically
        if self.bookmarks:
            self.bookmarks_menu.addSeparator()
            for bm in self.bookmarks:
                action = QAction(bm['title'], self)
                action.triggered.connect(lambda checked, url=bm['url']: self.add_tab(QUrl(url)))
                self.bookmarks_menu.addAction(action)

    # --- End Bookmark Management ---

    # --- Steno Search Specific Methods (Disabled as requested) ---
    def build_steno_index(self):
        # This method is effectively disabled, it will just show a status message.
        self.status.showMessage(self._T("indexing_status").format("Action disabled."))
        QMessageBox.information(self, "Steno Search Disabled",
                                "The Steno Search indexing feature is currently disabled in this version.")

    def perform_steno_search(self, query):
        # This method is effectively disabled, it will just show a status message.
        self.status.showMessage(f"Steno Search for '{query}' is disabled.")
        self.show_error_page(
            "Steno Search Disabled",
            f"Local search for '{query}' is not available in this version. Please use a regular URL."
        )

    # --- End Steno Search Specific Methods ---

    # --- Error Handling and Internet Check ---
    def check_internet_connection(self, host="8.8.8.8", port=53, timeout=3):
        """
        Check if there's an active internet connection by trying to connect to a known host.
        Host: Google's public DNS server
        Port: DNS port
        """
        try:
            socket.create_connection((host, port), timeout=timeout)
            return True
        except OSError:
            return False

    def on_load_finished(self, ok, browser):
        if not ok: # Load failed
            # Check if it was a network error
            if not self.check_internet_connection():
                self.show_no_internet_page()
            else:
                # It's a general load error (e.g., page not found, server error)
                # We can't get the exact error code from loadFinished directly
                # without more intricate QWebEnginePage signal handling (e.g., navigationRequest)
                # So we show a generic error page.
                self.show_error_page(
                    "Page Load Error",
                    f"Could not load {browser.url().toString()}. The page might not exist, or there might be a server issue."
                )
        else:
            # Page loaded successfully, ensure the title and URL bar are updated
            self.update_title(browser)
            self.update_urlbar_for_browser(browser, browser.url())

    def show_error_page(self, title, message):
        browser = self.current_browser()
        if not browser:
            return

        # --- BUG FIX: Use absolute path to find the HTML file ---
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, "ringzauber_error_page.html")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                html_content = f.read()
        except FileNotFoundError:
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error</title>
                <style>
                    body { font-family: sans-serif; background-color: #fcebeb; color: #cc0000; text-align: center; padding-top: 50px; }
                    .container { max-width: 600px; margin: auto; padding: 30px; border: 1px solid #ffaaaa; border-radius: 8px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    h1 { color: #cc0000; }
                    p { font-size: 1.1em; }
                    a { color: #0066cc; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Error Loading Page</h1>
                    <p>An unexpected error occurred.</p>
                    <p>Please check the address and try again.</p>
                    <p><a href="#" onclick="window.history.back();">Go Back</a> | <a href="http://stenoip.github.io">Go to Homepage</a></p>
                </div>
            </body>
            </html>
            """
            self.status.showMessage("Error: ringzauber_error_page.html not found. Using fallback.")

        html_content = html_content.replace("{ERROR_TITLE}", title)
        html_content = html_content.replace("{ERROR_MESSAGE}", message)

        encoded_html = QByteArray(html_content.encode('utf-8')).toBase64().data().decode('utf-8')
        browser.setUrl(QUrl(f"data:text/html;charset=utf-8;base64,{encoded_html}"))
        self.status.showMessage(f"Error: {title}")


    def show_no_internet_page(self):
        browser = self.current_browser()
        if not browser:
            return

        # --- BUG FIX: Use absolute path to find the HTML file ---
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, "ringzauber_no_internet_page.html")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                html_content = f.read()
        except FileNotFoundError:
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>No Internet Connection</title>
                <style>
                    body { font-family: sans-serif; background-color: #f0f4f7; color: #333; text-align: center; padding-top: 50px; }
                    .container { max-width: 600px; margin: auto; padding: 30px; border: 1px solid #d0e0ea; border-radius: 8px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    h1 { color: #2980b9; }
                    p { font-size: 1.1em; }
                    .icon { font-size: 60px; margin-bottom: 20px; }
                    a { color: #0066cc; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">🚫🌐</div>
                    <h1>No Internet Connection</h1>
                    <p>It looks like you're not connected to the internet.</p>
                    <p>Please check your network cables, Wi-Fi connection, or modem/router.</p>
                    <p><a href="javascript:location.reload();">Try Again</a> | <a href="http://stenoip.github.io">Go to Homepage (might not work without internet)</a></p>
                </div>
            </body>
            </html>
            """
            self.status.showMessage("Error: ringzauber_no_internet_page.html not found. Using fallback.")

        encoded_html = QByteArray(html_content.encode('utf-8')).toBase64().data().decode('utf-8')
        browser.setUrl(QUrl(f"data:text/html;charset=utf-8;base64,{encoded_html}"))
        self.status.showMessage("No Internet Connection")

    def handle_feature_permission_requested(self, origin, feature):
        # Example of handling permission requests (e.g., for geolocation, camera, microphone)
        # For simplicity, we auto-grant or deny. In a real browser, this would be a prompt.
        if feature == QWebEnginePage.Geolocation:
            print(f"Permission requested for Geolocation by {origin.toString()}")
            # Grant permission for geolocation
            origin.setFeaturePermission(feature, QWebEnginePage.PermissionGrantedByUser)
        elif feature == QWebEnginePage.MediaAudioCapture or feature == QWebEnginePage.MediaVideoCapture:
            print(f"Permission requested for Media Capture by {origin.toString()}")
            # Deny permission for media capture by default
            # A QMessageBox could be used here to ask the user.
            origin.setFeaturePermission(feature, QWebEnginePage.PermissionDeniedByUser)
        else:
            # Deny other unknown features
            print(f"Permission requested for unknown feature {feature} by {origin.toString()}. Denying.")
            origin.setFeaturePermission(feature, QWebEnginePage.PermissionDeniedByUser)


if __name__ == '__main__':
    # --- BUG FIX: Use absolute path for all file checks and accesses ---
    # Get the script's directory. This is the new robust way to find files.
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Create dummy icon files if they don't exist
    dummy_icons = {
        "ringzauber.ico": b'',
        "web_asset.png": b'', # for inspect (placeholder)
        "palette.png": b'', # for theme (placeholder)
        "info.png": b'', # for about (placeholder)
    }
    for filename, content in dummy_icons.items():
        file_path = os.path.join(script_dir, filename)
        if not os.path.exists(file_path):
            print(f"Creating dummy file: {file_path}")
            with open(file_path, "wb") as f:
                f.write(content)

    # Also, ensure error pages and bookmarks page exist or the fallbacks will be used
    for html_file in ["ringzauber_error_page.html", "ringzauber_no_internet_page.html", "ringzauber_bookmarks_page.html"]:
        file_path = os.path.join(script_dir, html_file)
        if not os.path.exists(file_path):
            print(f"Warning: {file_path} not found. Fallback HTML will be used for this page.")
            # Optionally write basic HTML content to these files if they are missing
            if html_file == "ringzauber_error_page.html":
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write("""<!DOCTYPE html><html><head><title>{ERROR_TITLE}</title><style>body { font-family: sans-serif; background-color: #fcebeb; color: #cc0000; text-align: center; padding-top: 50px; }.container { max-width: 600px; margin: auto; padding: 30px; border: 1px solid #ffaaaa; border-radius: 8px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }h1 { color: #cc0000; }p { font-size: 1.1em; }a { color: #0066cc; text-decoration: none; }a:hover { text-decoration: underline; }</style></head><body><div class="container"><h1>{ERROR_TITLE}</h1><p>{ERROR_MESSAGE}</p><p><a href="#" onclick="window.history.back();">Go Back</a> | <a href="http://stenoip.github.io">Go to Homepage</a></p></div></body></html>""")
            elif html_file == "ringzauber_no_internet_page.html":
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write("""<!DOCTYPE html><html><head><title>No Internet Connection</title><style>body { font-family: sans-serif; background-color: #f0f4f7; color: #333; text-align: center; padding-top: 50px; }.container { max-width: 600px; margin: auto; padding: 30px; border: 1px solid #d0e0ea; border-radius: 8px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }h1 { color: #2980b9; }p { font-size: 1.1em; }.icon { font-size: 60px; margin-bottom: 20px; }a { color: #0066cc; text-decoration: none; }a:hover { text-decoration: underline; }</style></head><body><div class="container"><div class="icon">🚫🌐</div><h1>No Internet Connection</h1><p>It looks like you're not connected to the internet.</p><p>Please check your network cables, Wi-Fi connection, or modem/router.</p><p><a href="javascript:location.reload();">Try Again</a> | <a href="http://stenoip.github.io">Go to Homepage (might not work without internet)</a></p></div></body></html>""")
            elif html_file == "ringzauber_bookmarks_page.html":
                 with open(file_path, "w", encoding="utf-8") as f:
                    f.write("""<!DOCTYPE html><html><head><title>{BOOKMARKS_PAGE_TITLE}</title><style>body { font-family: sans-serif; background-color: #f7f7f7; color: #333; margin: 0; padding: 20px; }.container { max-width: 800px; margin: auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 30px; }h1 { color: #2980b9; text-align: center; margin-bottom: 30px; }ul { list-style: none; padding: 0; }li { margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px; }li:last-child { border-bottom: none; }a { color: #0066cc; text-decoration: none; font-size: 1.1em; }a:hover { text-decoration: underline; }.url { font-size: 0.9em; color: #666; word-break: break-all; }.no-bookmarks { text-align: center; color: #777; padding: 30px; }</style></head><body><div class="container"><h1>{BOOKMARKS_PAGE_TITLE}</h1><ul id="bookmark-list">{BOOKMARK_LIST_HTML}</ul><div id="no-bookmarks" class="no-bookmarks" style="display: {NO_BOOKMARKS_DISPLAY};">{NO_BOOKMARKS_MESSAGE}</div></div></body></html>""")


    app = QApplication(sys.argv)
    QApplication.setApplicationName("Ringzauber Browser")
    QApplication.setApplicationVersion("1.4.0005") # Updated version
    print(f"DEBUG: Application version is set to {QApplication.applicationVersion()}.")

    window = MainWindow()
    print("DEBUG: Application is starting its event loop.")
    sys.exit(app.exec_())
