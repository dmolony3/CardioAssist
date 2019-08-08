/*
$('#textBox').keypress(function(event){
	event.preventDefault();
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        alert('You pressed a "enter" key in textbox'); 
    }
});
$('#textBox').live('keypress', function(e) {
    if (e.KeyCode == 70) {
        e.preventDefault();
        alert("or Shift was pressed");
    }
	alert('help');
});

$(document).on('keypress', '#textBox', function(e){
	var keyCode = e.KeyCode.val();
	if (e.KeyCode == 70) {
		e.preventDefault();
		alert(e.which + " or Shift was pressed");
	}
	alert('help');
});
*/
(function() {

var tabKeyPressed = false;

$("#textBox").keydown(function(e) {
   tabKeyPressed = e.keyCode == 9;
   if (tabKeyPressed) {
      e.preventDefault();
      return;
   }
});

$("#textBox").keyup(function(e) {
   var initialText = {"text": $(this).val()};
   if (tabKeyPressed) {
	    alert(initialText);
		$.ajax({
		  type: 'POST',
		  url: 'process1',
		  data: JSON.stringify(initialText),
		  dataType: 'json',
		  contentType: 'application/json; charset=utf-8',
          success: function (data) 
		{
            alert(JSON.stringify(data));
			$("#textBox").val(data['text']);
        }
	  });
      //$(this).val("TAB"); // Do stuff for TAB
      e.preventDefault();
	  //window.open("http://www.google.com/");
      return;
   }

   //Do other stuff when not TAB
});
})();

/*
$("#textBox").keyup(function(e) {
   if (tabKeyPressed) {
      $(this).val("TAB"); // Do stuff for TAB
      e.preventDefault();
	  window.open("http://www.google.com/");
      return;
   }

   //Do other stuff when not TAB
});

*/



