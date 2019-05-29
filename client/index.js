var current_user = "";
var token = "mytoken";

function show_view(view) {
    $(".view").hide();
    $("#" + view).show();
}

function show_feed() {
    let feed_request = new XMLHttpRequest();
    feed_request.onreadystatechange = function () {
        if (feed_request.readyState === 4 && feed_request.status === 200) {
            // console.log(feed_request.responseText);
            // console.log("FEED DATA RECEIVED:", feed_request.responseText);
            make_feed(JSON.parse(feed_request.responseText));

            let pic_request = new XMLHttpRequest();

            pic_request.onreadystatechange = function () {
                if (pic_request.readyState === 4 && pic_request.status === 200) {
                    let user_pic = document.getElementById("user-pic");

                    // console.log("received:::", JSON.parse(pic_request.responseText));
                    user_pic.src = JSON.parse(pic_request.responseText)[0].img;
                    // console.log("received image ok!");
                }
            };
            pic_request.open("POST", "userpicture");
            pic_request.send(JSON.stringify({username: current_user}));
        }
    };
    feed_request.open("GET", "feed");
    feed_request.setRequestHeader("Authorization", "Basic " + str_obj(document.cookie).current_user);
    // console.log("current_user:", current_user);
    feed_request.send();
    // feed_request.send(JSON.stringify({username: str_obj(document.cookie).current_user}));
    document.cookie = "state=feed;";
}

let Request = function () {
    let req_obj = {
        xhr: new XMLHttpRequest(),
        send: function (body) {
            req_obj.xhr.onreadystatechange = function () {
                if (req_obj.xhr.readyState === 4) {
                    req_obj.handlers[req_obj.xhr.status](req_obj.xhr);
                }
            };
            req_obj.xhr.send(body);
        },
        handlers: {},
        add_response_handler: function (status, handler) {
            req_obj.handlers[status] = handler;
        }
    };
    return req_obj;
};

function show_user(username) {
    console.log("### USERNAME: ", username, " ### CURRENT USER:", current_user);
    if (username !== current_user) {
        console.log("SEEING ANOTHER USER");

        $("#profile-pic-label").hide();

        let follow_button_o = $("#follow-button");
        let follow_button = follow_button_o.clone(true);
        follow_button_o.replaceWith(follow_button);
        let unfollow_button_o = $("#unfollow-button");
        let unfollow_button = unfollow_button_o.clone();
        unfollow_button_o.replaceWith(unfollow_button);
        follow_button.click(function () {
                let xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        unfollow_button.show();
                        follow_button.hide();
                    }
                    console.log("NOW FOLLOWING USER:", username);
                };
                xhr.open("PUT", "/users/" + current_user + "/followees/" + username);
                xhr.send();
            }
        );
        unfollow_button.click(function () {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    unfollow_button.hide();
                    follow_button.show();
                }

                console.log("STOPPED FOLLOWING USER:", username);
            };
            xhr.open("DELETE", "/users/" + current_user + "/followees/" + username);
            xhr.send();
        });

        let req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status === 200) {
                follow_button.hide();
                unfollow_button.show();

                console.log("FOLLOWING!!!");
            } else if (req.readyState === 4 && req.status === 204) {
                follow_button.show();
                unfollow_button.hide();

                console.log("NOT FOLLOWING!!!");
            }
        };
        req.open("GET", "/users/" + current_user + "/followees/" + username);
        req.send();
    }

    let user_info_req = new XMLHttpRequest();
    let user_info;
    user_info_req.onreadystatechange = function () {
        if (user_info_req.readyState === 4 && user_info_req.status === 200) {
            user_info = JSON.parse(user_info_req.responseText);
            console.log("USER: ", user_info);
            let user_posts_req = new XMLHttpRequest();
            user_posts_req.onreadystatechange = function () {
                if (user_posts_req.readyState === 4 && user_posts_req.status === 200) {
                    let all_posts = JSON.parse(user_posts_req.responseText);
                    for (let post of all_posts) {
                        console.log("POST: ", post);
                    }
                    make_feed({posts: all_posts});
                    $("#username-span").text(username);
                    let img_req = new XMLHttpRequest();
                    img_req.onreadystatechange = function () {
                        if (img_req.readyState === 4 && img_req.status === 200) {
                            $("#user-pic").attr("src", img_req.responseText);
                        }
                    };
                    img_req.open("GET", "/users/" + username + "/img");
                    img_req.send();
                }
            };
            user_posts_req.open("GET", "/users/" + username + "/posts");
            user_posts_req.send();

        }
    };
    user_info_req.open("GET", "/users/" + username);
    user_info_req.send();
}


function make_post(post_data) {

    console.log("POST DATA RECEIVED: ,", post_data);
    let post_template = document.getElementById("post-template");
    let post_clone = post_template.content.cloneNode(true);
    let post = post_clone.children[0];
    let user_img_req = new XMLHttpRequest();
    user_img_req.onreadystatechange = function () {
        if (user_img_req.readyState === 4 && user_img_req.status === 200) {
            post.getElementsByTagName("img")[0].src = user_img_req.responseText;
        }
    };
    user_img_req.open("GET", "/users/" + post_data.username + "/img");

    user_img_req.send();
    // post.getElementsByTagName("img")[0].src = "https://i.pravatar.cc/48";
    post.getElementsByClassName("post-user")[0].innerHTML = post_data.username;
    post.getElementsByClassName("post-user")[0].addEventListener("click", () => {
        console.log("LINK TO USER CLICKED!");
        show_user(post_data.username);
        // show_view("view-user");
    });
    post.getElementsByClassName("post-content")[0].innerHTML = post_data.content;
    let post_timestamp = post_clone.children[0].getElementsByClassName("post-timestamp")[0];
    var options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
    let date_string = new Date(post_data.timestamp).toLocaleDateString("default", options);
    post_timestamp.innerText = (date_string);
    let comment_section = post.getElementsByClassName("comment-section")[0];
    comment_section.style.display = "none";
    let comment_form = post.getElementsByClassName("comment-form")[0];
    console.log("ELEMENT: ", comment_form);
    comment_form.addEventListener("submit", function (e) {
        e.preventDefault();
        console.log("COMMENTING...");
        let comment_input = comment_form.getElementsByClassName("comment-input")[0];
        let content = comment_input.value;
        let request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                console.log("COMMENT ADDED OK!");
                console.log(new Date());

                let comment_template = document.getElementById("comment-template");
                let new_comment = comment_template.content.cloneNode(true).children[0];
                let new_content = new_comment.getElementsByClassName("comment-content")[0];


                // let comment_template = comment_section.getElementsByClassName("comment")[0];
                // let new_comment = comment_template.cloneNode(true);
                // let new_content = new_comment.getElementsByClassName("comment-content")[0];
                new_content.innerText = content;
                let comment_user = new_comment.getElementsByClassName("comment-user")[0];
                comment_user.innerText = current_user;
                comment_section.appendChild(new_comment);
            } else {
                console.log("COULD NOT POST COMMENT!");
            }
        };
        request.open("POST", "/posts/" + post_data.id + "/comments");
        request.send(JSON.stringify({username: current_user, content: content, parent: -1}));
    });
    let reply_button = post.getElementsByClassName("reply-button")[0];
    reply_button.addEventListener("click", () => {
        comment_section.style.display = "block";
        // comment_section.
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            console.log("STATE CHANGED TO", this.readyState);
            if (this.readyState === 4 && this.status === 200) {
                console.log("COMMENTS RECEVIED FOR POST ", post_data.id, request.responseText);
                let comments = JSON.parse(request.responseText);
                for (let comment of comments) {
                    let comment_template = document.getElementById("comment-template");
                    let new_comment = comment_template.content.cloneNode(true).children[0];
                    console.log(new_comment);
                    let content = new_comment.getElementsByClassName("comment-content")[0];
                    content.innerText = comment.content;
                    let comment_user = new_comment.getElementsByClassName("comment-user")[0];
                    comment_user.innerText = comment.username;
                    comment_section.appendChild(new_comment);
                }
            }
        };
        request.open("GET", "/posts/" + post_data.id + "/comments");
        request.send();
    });
    return post_clone;
}

function make_feed(feed_data) {
    show_view("view-feed");
    let post_container = $("#post-container");
    post_container.children().not("#new-post").remove();
    for (let post_data of feed_data.posts) {
        let post_clone = make_post(post_data);
        post_container.append(post_clone);
    }
    $("#username-span").text(current_user);
}

function setup_login() {
    let login_form = $("#login-form");
    login_form.submit(
        function (event) {
            event.preventDefault();
            let request = new XMLHttpRequest();
            console.log("ORIGIN:", request.origin);
            console.log("ORIGIN:", request.base);
            console.log("ORIGIN:", request.channel);
            request.onreadystatechange = function () {

                if (this.readyState === 4 && this.status === 200) {
                    console.log("LOGIN OK");
                    current_user = $("#login-username-input").val();
                    document.cookie = "current_user=" + current_user;
                    $("#profile-pic-label").show();
                    $("#follow-button").hide();
                    $("#unfollow-button").hide();
                    show_feed();
                } else {
                    let result = $("#login-result");
                    if (this.readyState === 4 && this.status === 204) {
                        result.css("visibility", "visible");
                        result.text("ERROR: username doesn't exist or password is wrong.");
                        $("#login-username-input").val("");
                        $("#login-password-input").val("");
                        console.log("ERROR: username doesn't exist or password is wrong.");
                    } else if (this.readyState === 4 && this.status === 202) {
                        result.css("visibility", "visible");
                        result.text("ERROR: unknown error");
                        console.log("ERROR: unknown error", request.responseText);
                    }
                }
            };
            request.open("POST", "login");
            let username = $("#login-username-input").val();
            let password = $("#login-password-input").val();
            request.send(JSON.stringify({username: username, password: password}));
        });
    let signup_button = $("#sign-up-button");
    signup_button.click(() => {
        show_view("view-signup");
    });
}

function setup_signup() {
    let signup_form = document.getElementById("signup-form");
    signup_form.addEventListener("submit", function (e) {
        e.preventDefault();
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                show_view("view-login");
            }
        };
        request.open("POST", "users");

        let username = $("#signup-username-input").val();
        let password = $("#signup-password-input").val();
        let info = $("#signup-info-input").val();
        request.send(JSON.stringify({username: username, password: password, info: info}));
    });
}

let timeout = null;

function setup_feed() {

    $("#home-button").click(
        () => {
            $("#profile-pic-label").show();
            $("#follow-button").hide();
            $("#unfollow-button").hide();
            show_feed();
        }
    );

    // let home_btn = document.getElementById("home-button");
    // home_btn.addEventListener("click", () => {
    //     document.getElementById("profile-pic-label").style.display = "block";
    //     let follow_button = document.getElementById("follow-button");
    //     let unfollow_button = document.getElementById("unfollow-button");
    //     follow_button.style.display = "none";
    //     unfollow_button.style.display = "none";
    //     show_feed();
    // });
    let new_post_form = document.getElementById("new-post-form");
    new_post_form.addEventListener("submit", function (e) {
        e.preventDefault();
        let new_post_content = document.getElementById("new-post-content");
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                let post_template = document.getElementById("post-template");
                let post_clone = post_template.content.cloneNode(true);
                let post_container = document.getElementById("post-container");
                let post_content = post_clone.children[0].getElementsByClassName("post-content")[0];
                let post_timestamp = post_clone.children[0].getElementsByClassName("post-timestamp")[0];
                post_timestamp.innerText = (new Date()).toString();
                post_content.innerHTML = new_post_content.value;
                document.getElementById("new-post").insertAdjacentElement("afterend", post_clone.children[0]);
                new_post_content.value = "";

            } else if (this.readyState === 4) {
                console.log("ERROR: could not post!");
            }
        };
        request.open("POST", "/users/" + current_user + "/posts");
        console.log(current_user);
        request.send(JSON.stringify({username: current_user, post: {content: new_post_content.value}}));
    });

    let search_form = document.getElementById("search-form");
    search_form.addEventListener("submit", function (e) {
        e.preventDefault();
        let search_term = document.getElementById("search-input").value;
        console.log("searching for: ", search_term);
        show_user(search_term);

    });
    let search_input = document.getElementById("search-input");
    search_input.addEventListener("input", function (e) {
        e.preventDefault();
        if (timeout) {
            window.clearTimeout(timeout);
            console.log("timeout cancelled");
        }
        timeout = window.setTimeout(() => {
            let request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    console.log("RECEIVED SUGGESTIONS: ", this.responseText);
                }
            };
            request.open("POST", "searchsuggestion");
            request.send(JSON.stringify({text: this.value}));
        }, 1000);
    });

    let follow_form = document.getElementById("follow-form");
    follow_form.addEventListener("submit", function (e) {
        e.preventDefault();
        let search_term = document.getElementById("follow-input").value;
        console.log("following: ", search_term);
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                console.log(this.responseText);
            }
        };
        request.open("PUT", "/users/" + current_user + "/followees/" + search_term);
        request.send();
    });
    let logout_button = document.getElementById("logout-button");
    logout_button.addEventListener("click", () => {
        document.cookie = "state=home;";
        document.cookie = "token=";
        document.cookie = "current_user=";
        show_view("view-login");
    });
    let file_input = document.getElementById("profile-pic-file");
    file_input.addEventListener("change", function () {
        let file = this.files[0];
        encodeImageFileAsURL(file, function (result) {
            let user_pic = document.getElementById("user-pic");
            user_pic.src = result;
            let request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState === 4 && request.status === 200) {
                    console.log("UPDATED PROFILE PICTURE OK!");
                }
            };
            request.open("PUT", "userpic");
            request.send(JSON.stringify({username: current_user, img: result}));
        });
    });
}

function encodeImageFileAsURL(file, callback) {
    var reader = new FileReader();
    reader.onloadend = function () {
        callback(reader.result);
    };
    reader.readAsDataURL(file);
}

function str_obj(str) {
    str = str.split('; ');
    var result = {};
    for (var i = 0; i < str.length; i++) {
        var cur = str[i].split('=');
        result[cur[0]] = cur[1];
    }
    return result;
}

(function () {

    let cookie = str_obj(document.cookie);

    if (cookie.state === "feed") {
        show_feed();
    }
    if (cookie.state === "home" || cookie.state === undefined) {
        show_view("view-login");
    }

    current_user = cookie.current_user;

    setup_login();

    setup_signup();

    setup_feed();

})();