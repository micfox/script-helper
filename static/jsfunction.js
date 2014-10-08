$(document).ready(function(){

//page click handle
  $(document).click(function(eventObject){
      console.log("Document clicked!");

      /* Create input box when click
      if($(".sentenceInput:last").val()==""){
	  console.log("print tag");
	  moveToCursorPosition(".sentenceInput:last",eventObject);
      }else{
	  $("<input class='sentenceInput' type='text' size='40'></input>").appendTo("#sentencePanel");
	  moveToCursorPosition(".sentenceInput:last",eventObject);
      }
      */
  });

    function moveToCursorPosition(element,eventObject){
	$(element).animate({
	    'left': eventObject.pageX -2,
	    'top': eventObject.pageY - 10,
	},0);
    }

    $("#sentencePanel").click(function(eventObject){
	eventObject.stopPropagation();
    });

//sentenceInput submit
    $(document).on("change","input",function(event){
	var text = this.value;
	console.log(text);
	$.ajax({
	    url: '/recordSentence',
	    type: 'POST',
	    dataType: 'html',
	    data: {'text': text},
	});
    });

    $(document).on("keypress","p",function(event){
	console.log(this.innerHTML);
	if(event.which ==13){
//	    if(this.innerHTML.search("<div><br></div>") != -1){
	    //should determin keystroke with caret position
	}
    });

    $(document).on("keydown","code",function(event){
	console.log(event.which);
	console.log(this.innerHTML);
	if(event.which == 13){
	    if(this.innerHTML == ".."){
		$("<div class = 'textField'><code contenteditable = 'true'>..</code></div>").appendTo(this.parent());}else{
		    $("<code contenteditable = 'true'>...</code>").appendTo(this.parent);
//		    console.log(this.parent.innerHTML);
	    }
	    var newem = $(".textField").find("code");
	    newem.focus();
//	    console.log(newem[0].innerHTML);
	    return false;
	}
    });

/*
    $(".textField").keypress(function(event){
	if(event.which == 13){
	    $("<div class = 'textField'><code contenteditable = 'true'>zzzzzz</code></div>").appendTo("#panel");
	}
    });
*/
//project create,delete,open
//
  var startFromIndex = 2;
  var projectIndex = -1;
  var projectIndex3 = -1;
  function loadLastProjectIndex(){
      setProjectSelectIndex(projectIndex);
  }

  //make :select ready to accept new value
  setProjectSelectIndex(-1);
  function setProjectSelectIndex(i){
      $("#projectSelection").prop("selectedIndex", i);
  }

  var form = $('#form');
  var submit = $('#submit');
  var alert = $('.alert');

  $("#projectSelection").change(function(e){
      e.preventDefault();
      console.log(projectIndex3 + " " + projectIndex + " " + this.selectedIndex);

      //Stop process event if selectedIndex is reseted by a cancelled creation/deletion
      if((projectIndex < startFromIndex) && (this.selectedIndex == projectIndex3)){
	  return;
      }
      console.log(this.value);
      var projectListLength = this.length;

      if(this.value == "CREATE-NEW"){
	  var input = prompt("Input project name")
	  if(input == null){
	      loadLastProjectIndex();
	      return;
	  }else{
	      if(inputExistProjectP(this,input)){
		  openProject(this,input);
	      }else{
		  createProject(input);
	      }
	  }
      }
      if(this.value == "DELETE-CURRENT"){
	  var input = prompt("Confirm deletion(Unrecoverable):","Cancel")
	  if(input == "Delete"){
	      delectProject(input);
//	      setProjectSelectIndex(-1);
	  }else{
	      loadLastProjectIndex();
	      return;
	  }
      }

      //select project handle.
      //Disable or enable delete option.
      if(this.selectedIndex >= startFromIndex){
	  $("#optionDelete").prop("disabled", false);
	  openProject(this,this.value);
      }else{
	  $("#optionDelete").prop("disabled", true);
      }

      //Save index.
      projectIndex3 = projectIndex;
      projectIndex = this.selectedIndex;
      console.log("End event: " + projectIndex3 + " " + projectIndex + " " + this.selectedIndex);

      function inputExistProjectP(tag,name){
	  for (var i = startFromIndex; i < projectListLength; i++){
	      if(name.toUpperCase() == tag.options[i].text.toUpperCase()){
		  console.log("match!");
		  break;
	      }
	  }
	  if(i < projectListLength){
	      console.log("index: " + i);
	      setProjectSelectIndex(i);
	      return true;
	  }else{
	      return false;
	      }
      }

      function openProject(tag,name){
	  console.log("open called.");
	  $.ajax({
	      url: '/openProject',
	      type: 'POST',
	      dataType: 'html',
	      data: {'name': name},
	  });
      }

      function createProject(projectName){
	  console.log("createProject();");
	  var jsonobj = {'name': projectName,};
	  console.log(jsonobj);
	  $.ajax({
	      url: '/createProject',
	      type: 'POST',
	      dataType: 'html',
	      data: {'name': projectName,},
	      success: function(){},
	      
	  });
      }
  });


  //form submit event
  $("#eventForm").submit(function(e){
      e.preventDefault();
      var fd = new FormData($(this)[0]);
      console.log($("#eventForm").serializeArray());
      $.ajax({
	  url: '/process',
	  type: 'POST',
	  dataType: 'html',
	  data: $("#eventForm").serializeArray(),
	  beforeSend: function(){
	      alert.fadeOut();
	      submit.html('Sending...');
	      console.log("before send");
	  },
	  success: function(data){
	      alert.html(data).fadeIn();
	      //form.tirgger('reset');
	      submit.html('Send Email');
	      console.log(data);
	  },
	  error: function(e){
	      console.log(e);
	  },
      });
  });
});

function postText(data){
  $.ajax({
      data: data,
      processData: false,
      contentType: false,
      type: 'POST',
      success: function(data){
	  console.log(data);
      }
  });
}

function buttonFunc(){
    alert($(".alert").html());
}
