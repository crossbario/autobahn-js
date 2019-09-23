# Utilities

## HTTP requests

Autobahn includes helpers to do HTTP requests returning JS promises, allowing
a modern style of asynchronous programming without callback hell.

To do a HTTP/GET requesting JSON data:

```javascript
autobahn.util.http_get_json("/config").then(
    function (config) {
        console.log(config);
    },
    function (err) {
        console.log(err);
    }
);
```

JSON data can be served directly from Crossbar.io using a webservice of type `json`.

Here is a node configuration that will serve the `value` configured on the HTTP
URL `/config`:


```json
{
    "workers": [
        {
            "type": "router",
            "transports": [
                {
                    "type": "web",
                    "endpoint": {
                        "type": "tcp",
                        "port": 8080
                    },
                    "paths": {
                        "/": {
                            "type": "static",
                            "directory": "../web",
                            "options": {
                                "enable_directory_listing": true
                            }
                        },
                        "config": {
                            "type": "json",
                            "value": {
                                "nodes": [
                                    "ws://localhost:8081/ws",
                                    "ws://localhost:8082/ws",
                                    "ws://localhost:8083/ws",
                                    "ws://localhost:8084/ws"
                                ]
                            }
                        },
                    }
                }
            ]
        }
    ]
}
```
