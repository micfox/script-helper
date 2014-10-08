(asdf:load-system :cffi :hunchentoot :cl-who)
(defpackage :web-server
     (:use :common-lisp :hunchentoot :cl-who :cffi))
(in-package :web-server)

(pushnew #P "./Code/api2/" *foreign-library-directories*)
(defparameter nlp-data-dir "./Code/api2/") ;dir contains Data for NLPIR
(define-foreign-library ictclas2014
  (:unix "libNLPIR.so"))

(use-foreign-library ictclas2014)

(defctype init-result :boolean)
(defcfun "NLPIR_Init" init-result
  (init-dir-path :string)
  (encoding :int))
(defcfun "NLPIR_Exit" :boolean)

(defctype process-result :string)
(defcfun "NLPIR_ParagraphProcess" process-result
  (paragraph :string)
  (pos-tag :int))

(defcfun "NLPIR_ImportUserDict" :int
  (dict-filename :string)) ;only use once if not changed later
(defcfun "NLPIR_AddUserWord" :int
  (user-word :string)) ;Add a word:"hello n"
(defcfun "NLPIR_DelUsrWord" :int
  (user-word :string))
(defcfun "NLPIR_SaveTheUsrDic" :int);when add/del user dict,use this to save

(defcfun "NLPIR_GetKeyWords" :string
  (line :string)
  (max-key-limit :int)
  (weight :boolean))
(defcfun "NLPIR_GetNewWords" :string
  (line :string)
  (max-key-limit :int)
  (weight :boolean))

(defcfun "NLPIR_SetPOSmap" :int
  (pos :int));0,1,2,3

(defun nlp-init ()
  (nlpir-init nlp-data-dir 1))
(defun nlp-exit ()
  (nlpir-exit))
(defun nlp-process (text)
  (nlpir-paragraphprocess text 1))

(defparameter *textdata* 'nil)
(defvar *projects-list* nil)
(defvar *project-ins* nil)
(defvar server-acceptor
  (make-instance
   'hunchentoot:easy-acceptor
   :port 8080
   :document-root #p "/home/wujt/work/static/"))
(defun httpd-start ()
     (hunchentoot:start server-acceptor))
(defun httpd-stop ()
  (hunchentoot:stop server-acceptor))
(defun exit-all ()
  (nlp-exit)
  (httpd-stop))

(defmacro with-html (&body body)
  `(with-html-output-to-string (*standard-output* nil :prologue t) ,@body))

(with-open-file (in "projects-list.db" :if-does-not-exist :create)
    (with-standard-io-syntax
      (setf *projects-list* (read in nil))))

(defun save-projects-list* ()
  (with-open-file (stream "projects-list.db" 
			:direction :output 
			:if-exists :supersede)
    (print *projects-list* stream)))
(defun save-project-data* (project-name)
  (with-open-file (stream (concatenate 'string project-name ".proj" )
			:direction :output 
			:if-exists :supersede)
    (print *project-ins* stream)))


(defun add-project-to-list ()
  ())

(defun create-project (name)
  (if (not (find name *projects-list* :test 'equal)) 
      (setf *projects-list* (append (list name) *projects-list*)))
  (save-projects-list*))
(defun open-project (name)
  (with-open-file (in (concatenate 'string name ".proj" ) :if-does-not-exist :create)
    (with-standard-io-syntax
      (setf *project-ins* (read in nil)))))

(defmacro html-project-option ()
  `(with-html-output (*standard-output*)
     ,@(loop for p in *projects-list* collect
	    `(:option ,p))))

(hunchentoot:define-easy-handler
;;main page dispatch
 (main-page :uri "/main" :default-request-type :post)
    (foo
     (boxid :parameter-type 'integer))
  (with-html
    (:html
     (:head (:link :rel "stylesheet" :type "text/css" :href "style.css") 
	    (:title "Everything start here - Main"))
     (:body (:script :src "jquery-1.11.1.js")
	    (:script :src "jsfunction.js")
	    (:form :id "projectSelectionForm"
	     (:select :id "projectSelection"
		     (:option :value :create-new "[Open...]")
		     (:option :id "optionDelete" :value :delete-current :disabled "disabled" "[Delete...]")
		     (html-project-option)
		     (:option "Project-D")))
	    (:h1 "Description:......")
	    (:div :class "alert" :contenteditable "true" "div text")
	    (:button :onclick "buttonFunc();" "ClickMe")
	    (:div :class "sentencePanel" 
;;		  (:input :class "sentenceInput" :type "text")
		  (:p :contenteditable "true" "some text"))
	    (:div :id "codePanel"
	     (:div :class "codeph"
		   (:div :class "textField"
			 (:code :contenteditable "true" ">"))))))))

(hunchentoot:define-easy-handler (create-handler :uri "/openProject") (name)
  (open-project name)
  (format nil "~A" "Project opened."))
(hunchentoot:define-easy-handler (process-handler :uri "/process") (foo)
  (setf (hunchentoot:content-type*) "text/plain")
  (format nil "~A ~A" "response:" foo))
(hunchentoot:define-easy-handler (record-handler :uri "/recordSentence") (text)
  (setf (hunchentoot:content-type*) "text/plain")
  (record-text text)
  (format nil "~A ~A" "sentence logged:" text))
(defun record-text (text)
  (if (nlp-init)
      (push (process-text text) *project-ins*)))
(defun process-text (text)
  (list :raw text :tagged (nlp-process text)))

(hunchentoot:define-easy-handler (create-project-handler :uri "/createProject")
    (name)
  (create-project name))



